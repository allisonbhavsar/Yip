pub mod handlers;

use crate::auth;
use crate::db;

use handlers::{User, DbUser};
use rocket_contrib::json::Json;

use std::io::Read;
use rocket::{Request, Data, Outcome::*};
use rocket::data::{self, FromDataSimple};
use rocket::http::{Status};
use rocket::response::status;

use db::DbConn;

// Limit to prevent DoS attacks.
const LIMIT: u64 = 256;

// Struct with user name and token for blocking users
#[derive(Queryable, Serialize, Deserialize)]
struct TokenUser {
    token: String,
    username: String,
}

// Struct represneting the fields of a user that are needed for frontend display
#[derive(Queryable, Serialize, Deserialize)]
pub struct DisplayUser {
    pub username: String,
    pub profilepicture: Option<String>,
    pub sitewideban: bool,
    pub is_owner: bool,
    pub is_blocked: bool,
    pub is_followed: bool,
}

/**
 * Helper method that converts DbUser to DisplayUser
 * @param user: the DbUser
 * @param token: user token
 * @param connection: database connection
 *
 * @return returns a DisplayUser
 */
fn to_display_user(user: DbUser, token: String, connection: &DbConn) -> DisplayUser {

	// Converts token into uuid
	let profile_uuid = auth::get_uuid_from_token(&token);

	// Return display kennel created
	DisplayUser {
		username: user.username,
	    profilepicture: user.profilepicture,
	    sitewideban: user.sitewideban,
	    is_owner: user.profile_uuid.eq(&profile_uuid),
	    is_blocked: match handlers::get_block_relationship(profile_uuid, user.profile_uuid, connection) {
				        Ok(_u) => true,
				        Err(e) => false,
				    },
	    is_followed: match handlers::get_follow_relationship(profile_uuid, user.profile_uuid, connection) {
				        Ok(_u) => true,
				        Err(e) => false,
				    },
	}

}

struct Username {
	name: String
}

impl FromDataSimple for Username {
	type Error = String;

    fn from_data(_req: &Request, data: Data) -> data::Outcome<Self, String> {
		// Possibly need to check the content type is correct first

        // Read the data into a String.
        let mut name = String::new();
        if let Err(e) = data.open().take(LIMIT).read_to_string(&mut name) {
            return Failure((Status::InternalServerError, format!("{}", e)));
        }

        // Return successfully.
        Success(Username { name })
    }
}

/** 
 * Method that unfollows a user
 * @param kennel: JSON of the report
 *
 * @return returns TBD
 */
#[post("/unfollow_user", data="<follow>", rank=1)]
fn unfollow_user(follow: Json<TokenUser>, connection: DbConn) -> Result<status::Accepted<String>, status::Conflict<String>> {
	
	// Get token uuid (follower)
	let follower = auth::get_uuid_from_token(&follow.token);

	// Get followee uuid
	let followee = handlers::get_uuid_from_username(&follow.username, &connection);

	// Check if either are nil (not found)
	if follower.is_nil() || followee.is_nil() {
		return Err(status::Conflict(Some("Follower or followee not found".to_string())));
	}

	// Attempt to delete follow relation from database 
	let unfollow = handlers::unfollow(follower, followee, &connection);
	
	// Check if successful insertion into database
	match unfollow {
		Ok(_id) => Ok(status::Accepted(None)),
		Err(e) => Err(e),
	}
	
}

/** 
 * Method that follows a user
 * @param kennel: JSON of the report
 *
 * @return returns TBD
 */
#[post("/follow_user", data="<follow>", rank=1)]
fn follow_user(follow: Json<TokenUser>, connection: DbConn) -> Result<status::Accepted<String>, status::Conflict<String>> {
	
	// Get token uuid (follower)
	let follower = auth::get_uuid_from_token(&follow.token);

	// Get followee uuid
	let followee = handlers::get_uuid_from_username(&follow.username, &connection);

	// Check if either are nil (not found)
	if follower.is_nil() || followee.is_nil() {
		return Err(status::Conflict(Some("Follower or followee not found".to_string())));
	}

	// Attempt to insert follow relation into database 
	let follow = handlers::follow(follower, followee, &connection);
	
	// Check if successful insertion into database
	match follow {
		Ok(_id) => Ok(status::Accepted(None)),
		Err(e) => Err(e),
	}
	
}

/** 
 * Method that blocks a user
 * @param kennel: JSON of the report
 *
 * @return returns TBD
 */
#[post("/block_user", data="<block>", rank=1)]
fn block_user(block: Json<TokenUser>, connection: DbConn) -> Result<status::Accepted<String>, status::Conflict<String>> {
	
	// Get token uuid (blocker)
	let blocker = auth::get_uuid_from_token(&block.token);

	// Get blockee uuid
	let blockee = handlers::get_uuid_from_username(&block.username, &connection);

	// Check if either are nil (not found)
	if blocker.is_nil() || blockee.is_nil() {
		return Err(status::Conflict(Some("Blocker or blockee not found".to_string())));
	}

	// Attempt to insert block relation into database 
	let block = handlers::insert_block(blocker, blockee, &connection);
	
	// Check if successful insertion into database
	match block {
		Ok(_id) => Ok(status::Accepted(None)),
		Err(e) => Err(e),
	}
	
}

/** 
 * Method that returns a user from database given the username
 * @param username: username of user whos data is retrieved
 * @param token: the user token on frontend
 * @param connection: database connection
 *
 * @return returns JSON of the user or error status
 */
#[get("/get_user/<username>/<token>")]
fn get_user(username: String, token: String, connection: DbConn) -> Result<Json<DisplayUser>, status::NotFound<String>> {

	// Gets uuid from username
	let uuid = handlers::get_uuid_from_username(&username, &connection);

	// Get User from database
	let user = handlers::get_user_from_uuid(uuid, &connection);

	// Pattern match to see if user found successfully
	match user {
		Ok(r) => Ok(Json(to_display_user(r, token, &connection))),
		Err(e) => Err(status::NotFound(e.to_string())),
	}
	
}

/**
 * Method that returns whether the user is logged in
 * @param token: the jwt used to verify if logged in
 *
 * @return returns a String indicating if logged in or not
 */
#[post("/auth", data="<token>")]
fn auth(token: String) -> String {

	// Check if valid token passed in
	let is_logged_in = auth::validate_token(token);

	// Return whether logged in or not
	if is_logged_in {
		return "true".to_string(); 
	} else {
		return "false".to_string();
	}

}

/**
 * Method that prints out all the users in database
 * @param connection: database connection
 *
 * @return N/A
 */
#[get("/users", rank=1)]
fn list_users(connection: DbConn) -> () {

	// Makes database call to get all users
	let all_users = handlers::all(&connection)
        .map(|user| Json(user));
        
	
	// Prints out user/email/pw of each user in database
	for vec in all_users {
		for u in vec.iter() {
			println!("User: {} Email: {} Password: {}", u.username, u.email, u.password);
		} 
	}

}

/** 
 * Method for handling password reset
 * @param user: the Json representation of a User
 * @param connection: database connection
 *
 * @return returns a result with Accepted or Unauthorized status
 */
#[post("/recover_password", data="<user>", rank=1)]
fn recover_password(user: Json<User>, connection: DbConn) -> Result<status::Accepted<String>, status::Unauthorized<String>> {

	// Get uuid of username/email if they are linked to same account
	let id = handlers::username_email_linked(&user.username, &user.email, &connection);

	// Check that valid id was found
	if !id.is_nil() {

		// Attempt to change password
		let successful_change = handlers::update(id, &user.password, &connection);

		// Prints whether login was successful (indicated by non nill uuid)
		println!("Password reset {}", successful_change);

		// Returns true if successfully changed
		if successful_change {
    		return Ok(status::Accepted(None));
		}
	}

	// Prints whether login was successful (indicated by non nill uuid)
	println!("Password reset failed");

	// Return false if unsucessful
	Err(status::Unauthorized(None))
}

/** 
 * Method to handle login request
 * @param user: the Json representation of a User
 * @param connection: database connection
 *
 * @return returns a String with authentication token if successfully logged in, otherwise
 * returns status error 401 with optional error
 */
#[post("/login", data="<user>", rank=1)]
fn login(user: Json<User>, connection: DbConn) -> Result<String, status::Unauthorized<String>> { 

	// Attempt to login user by reading database
	let successful_login = handlers::get(user.into_inner(), &connection);

	// Prints whether login was successful (indicated by non nill uuid)
	println!("Login {}", successful_login);
	
	// Return authentication token if successful login
	if !successful_login.is_nil() {
		match auth::create_token(successful_login) {
			Ok(t) => Ok(t), 
			Err(e) => Err(status::Unauthorized(Some(e.to_string()))), 
		}
	} else { // Return failure if unsucessful
		Err(status::Unauthorized(None))
	}
}

/**
 * Method to handle register request
 * @param user: the Json representation of a User
 * @param connection: database connection
 *
 * @return returns a String with auth token if successful registration, otherwise an error
 * status along with a String indicating the if user/email field was taken
 */
#[post("/register", data="<user>", rank=1)]
fn register(user: Json<User>, connection: DbConn) -> Result<String, status::Conflict<String>> { 

	// Attempt to insert user into database 
	let successful_registration = handlers::insert(user.into_inner(), &connection);
	
	// Check if successful insertion into database
	match successful_registration {

		// Successfully registered, create token using id and return it
		Ok(id) => match auth::create_token(id) {
					Ok(t) => Ok(t), 
					Err(e) => Err(status::Conflict(Some(e.to_string()))), 
				 },
		// Unsuccessful registration, return the error
		Err(e) => {
			println!("{}", e.to_string());
			Err(status::Conflict(Some(e.to_string())))
		}
	}

}

/**
 * Mount the user routes
 */
pub fn mount(rocket: rocket::Rocket) -> rocket::Rocket {
    rocket.mount("/", routes![login, register, recover_password, list_users, auth, get_user, block_user, follow_user, unfollow_user])  
}