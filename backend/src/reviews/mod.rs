pub mod handlers;
pub mod reviewmultipart;

extern crate chrono;
extern crate json;

use crate::auth;
use crate::db;

use handlers::{Review, DisplayReview};
use rocket_contrib::json::Json;

use db::DbConn;
use uuid::Uuid;

use rocket::response::status;

use std::io::prelude::*;
use std::fs::File;

use reviewmultipart::ReviewMultipart;

use serde_json::{Value, Map};


/** 
 * Method that returns a Review from database given the ID
 * @param id: Uuid of review as a string
 * @param connection: database connection
 *
 * @return returns JSON of the review or error status
 */
fn get_review_helper(id: String, connection: &DbConn) -> Result<DisplayReview, status::NotFound<String>> {

	// Converts string to a uuid
	let uuid = Uuid::parse_str(&id).unwrap();

	// Get Review from database
	let review = handlers::get(uuid, connection);

	// Pattern match to see if review found successfully
	match review {
		Ok(r) => Ok(r),
		Err(e) => Err(status::NotFound(e.to_string())),
	}
}

/** 
 * Helper method that prints out all reviews
 * @param connection: database connection
 *
 * @return returns a vector with the review ids
 */
fn list_reviews_helper(connection: &DbConn) -> Json<Vec<String>> {

	// Makes database call to get all users
	let all_reviews = handlers::all(&connection)
        .map(|review| Json(review));
        
    // Creates vector to store review ids
    let mut review_ids = vec![];

	// Prints out title/text/id of each review in database
	for vec in all_reviews {
		for r in vec.iter() {
			println!("Title: {} Text: {} Id: {}", r.title, r.text, r.review_uuid);
			review_ids.push(r.review_uuid.hyphenated().to_string());
		} 
	}

	// Return vector with all the ids
	return Json(review_ids);
}

/**
 * Helper method that takes a review map and file paths and creates
 * a Review object from it
 * @param review_obj: map of field names and values received
 * @param paths: list of file paths to pictures
 *
 * @return returns a Review object
 */
fn review_creation_helper(review_obj: &Map<String, Value>, paths: Vec<String>) -> Review {

	// TODO: Figure out tags once implemented in frontend
	Review {
		kennel_uuid: review_obj.get("kennel_uuid").unwrap().to_string(),
		title: review_obj.get("title").unwrap().to_string(),
		author: review_obj.get("author").unwrap().to_string(),
		timestamp: review_obj.get("timestamp").unwrap().to_string(),
		text: review_obj.get("text").unwrap().to_string(),
		images: if paths.iter().len() == 0 {None} else {Some(paths)},
		rating: review_obj.get("rating").unwrap().as_i64().unwrap() as i32,
		tags: None,
	}
}

/**
 * Helper method that returns the username corresponding to a token, "" if none
 * @param token: the token
 * @param connection: database connection
 *
 * @return returns a String corresponding to username of token, "" if none
 */
fn token_to_username(token: String, connection: &DbConn) -> String {

	// Get uuid from token passed in
	let profile_uuid = auth::get_uuid_from_token(&token);

	// Look for the username of the uuid in database
	match super::users::handlers::get_user_from_uuid(profile_uuid, connection){
		Ok(u) => u.username,
		Err(_e) => "".to_string(),
	}
}

// Struct with review ID and user token for editing/deleting reviews
#[derive(Queryable, Serialize, Deserialize)]
struct ReviewToken {
    review_uuid: String,
    token: String,
}

/** 
 * Method that returns vector of kennel reviews
 * @param kennel_name: the name of the kennel that is queried
 * @param connection: database connection
 *
 * @return returns JSON of the review or error status
 */
#[get("/get_reviews/<kennel_name>")]
fn get_kennel_reviews(kennel_name: String, connection: DbConn) -> Result<Json<Vec<DisplayReview>>, status::NotFound<String>> {

	// Converts kennel name to kennel id
	let kennel_uuid = super::kennels::handlers::get_kennel_uuid_from_name(kennel_name, &connection);

	// Check for nil id (meaning kennel name does not exist)
	if kennel_uuid.is_nil() {
		return Err(status::NotFound("Kennel not found".to_string()));
	}

	// Makes database call to get all reviews with kennel uuid
	let all_reviews = handlers::all_kennel_reviews(kennel_uuid, &connection);

	// Prints out title/text/rating of each review in database
	for v in &all_reviews {
		for r in v.iter() {
			println!("Author Name: {} Title: {} Time: {}", r.author, r.title, r.timestamp.to_string());
		} 
	}

	Ok(Json(all_reviews.unwrap()))
}

/** 
 * Method that returns a Review from database given the ID
 * @param id: Uuid of review as a string
 * @param token: jwt
 * @param connection: database connection
 *
 * @return returns JSON of the review or error status
 */
#[get("/get_review/<id>/<token>")]
fn get_review(id: String, token: String, connection: DbConn) -> Result<Json<DisplayReview>, status::NotFound<String>> {

	// Get username from token passed in
	let profile_username = token_to_username(token, &connection);

	// Pattern match to see if review found successfully
	match get_review_helper(id, &connection) {
		Ok(mut r) => {
			r.is_author = profile_username.eq(&r.author); // set field of DisplayReview
			Ok(Json(r))
		},
		Err(e) => Err(e),
	}
}

/** 
 * Method that removes a review from database if token matches author of review
 * @param review: Json with uuid and token
 * @param connection: database connection
 * 
 * @return returns accepted status if removed, other unauthorized
 */
#[post("/remove_review", data="<review>")]
fn remove_review(review: Json<ReviewToken>, connection: DbConn) -> Result<status::Accepted<String>, status::Unauthorized<String>> {

	// Get tokens username
	let profile_username = token_to_username(review.token.clone(), &connection);

	// Converts string to a uuid
	let uuid = Uuid::parse_str(&review.review_uuid).unwrap();

	// Get Review from database
	let review = handlers::get(uuid, &connection);

	// Pattern match to see if review found successfully
	match review {
		Ok(r) => {
			// If token matches author of review, attempt to delete
			if profile_username.eq(&r.author) { 
				match handlers::delete(uuid, &connection){
					Ok(_u) => Ok(status::Accepted(None)),
					Err(e) => Err(status::Unauthorized(Some(e.to_string()))),
				}
			} else {
				Err(status::Unauthorized(Some("User is not the author".to_string())))
			}
		},
		// Review not found in database
		Err(e) => Err(status::Unauthorized(Some(e.to_string()))),
	}
}

/** 
 * TODO: Not finished
 * @param review: Json with Review
 * @param connection: database connection
 *
 * @return returns TBD
 */
#[post("/edit_review", data="<review>")]
fn edit_review(review: Json<ReviewToken>, connection: DbConn) -> Result<status::Accepted<String>, status::Unauthorized<String>> {
	
	// Get tokens username
	let profile_username = token_to_username(review.token.clone(), &connection);

	// Converts string to a uuid
	let uuid = Uuid::parse_str(&review.review_uuid).unwrap();

	// Get Review from database
	let review = handlers::get(uuid, &connection);

	// Pattern match to see if review found successfully
	match review {
		Ok(r) => {
			// If token matches author of review, TODO: attempt to update
			if profile_username.eq(&r.author) { 
				// TODO: Attempt to update
				Ok(status::Accepted(None))
			} else {
				Err(status::Unauthorized(Some("User is not the author".to_string())))
			}
		},
		// Review not found in database
		Err(e) => Err(status::Unauthorized(Some(e.to_string()))),
	}
}

/** 
 * Method that creates a review
 * @param data: multipart data with the review contents/files uploaded
 * @param connection: database connection
 *
 * @return returns review uuid if successfuly created, otherwise conflict status
 */
#[post("/create_review", data="<data>")]
fn create_review(data: ReviewMultipart, connection: DbConn) -> Result<String, status::Conflict<String>> { 

	// Create object from stringified version passed in
	let review_value : Value = serde_json::from_str(&data.review).unwrap();
	let review_obj = review_value.as_object().unwrap();

	// Create vector of file paths
	let mut paths = vec![];

	// Iterate through files passed in, store on server in static/reviewpics/<filename>
	for (i, img) in data.images.iter().enumerate() {

		// Create file path using filename, create file with it, write the image
		let file_path = format!("static/reviewpics/{}", &data.names[i]);
		let mut buffer = File::create(file_path.clone()).unwrap();
		
		// Catch error
		match buffer.write(&img){
			Ok(w) => w,
			Err(e) => return Err(status::Conflict(Some(e.to_string()))),
		};

		// Add path to vector
		paths.push(format!("reviewpics/{}", &data.names[i]));
	}

	// Create review object in correct format
	let review = review_creation_helper(review_obj, paths);
	
	// Attempt to insert review into database
	match handlers::insert(review, &connection){
		Ok(r) => Ok(r.review_uuid.hyphenated().to_string()),
		Err(e) => Err(status::Conflict(Some(e.to_string()))),
	}

}


/** 
 * Method that prints out all reviews
 * @param connection: database connection
 *
 * @return returns a vector with the review ids
 */
#[get("/reviews", rank=1)]
fn list_reviews(connection: DbConn) -> Json<Vec<String>> {

	// Calls helper function to get a list of all reviews
	list_reviews_helper(&connection)
}

/** 
 * Method that loads all of the reviews on home page, given a jwt
 * @param token: the jwt of user, "0" if not logged in
 *
 * @return returns true or false indicating if password changed sucessfuly
 */
#[post("/load_reviews", data="<token>", rank=1)]
fn load_reviews(token: String, connection: DbConn) -> Result<Json<Vec<DisplayReview>>, status::NotFound<String>> {
	
	// Create a vector with all of the reviews to display
	let mut reviews : Vec<DisplayReview> = vec![];

	// Check if user is logged in by checking token passed in
	if auth::validate_token(token) {

		// TODO: Generate user specific reviews based on followed kennels

		// Get all of the IDs
		let review_ids = list_reviews_helper(&connection);

		// Iterate through review IDs and add all reviews to vector
		for id in review_ids.iter() {
			reviews.push(get_review_helper(id.to_string(), &connection).unwrap());
		}

	} else {

		// TODO: Generate generic most recent popular reviews 

		// Get all of the IDs
		let review_ids = list_reviews_helper(&connection);

		// Iterate through review IDs and add all reviews to vector
		for id in review_ids.iter() {
			reviews.push(get_review_helper(id.to_string(), &connection).unwrap());
		}

	}

	// Return a Result depending on if reviews were found
	if reviews.iter().len() == 0 {
		Err(status::NotFound("No Reviews".to_string()))
	} else {
		Ok(Json(reviews))
	}
}

/**
 * Mount the review routes
 */
pub fn mount(rocket: rocket::Rocket) -> rocket::Rocket {
    rocket.mount("/", routes![load_reviews, list_reviews, create_review, edit_review, remove_review, get_review, get_kennel_reviews])  
}