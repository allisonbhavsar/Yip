use diesel;
use diesel::prelude::*;
use uuid::Uuid;
use crate::schema::messages;

use chrono::NaiveDateTime;

use crate::auth;
use std::collections::HashMap;
extern crate priority_queue;

fn from_message(message: Message, connection: &PgConnection) -> InsertMessage {
        InsertMessage{
            sender: auth::get_uuid_from_token(&message.sender), 
            recipient: super::super::users::handlers::get_uuid_from_username(&message.recipient, connection),
            text: message.text,
        }
    
}

fn to_message(message: &DbMessage, sender: Uuid, _connection: &PgConnection) -> DisplayMessage {
        DisplayMessage{
            is_sender: sender.eq(&message.sender),
            text: message.text.clone(),
            timestamp: message.timestamp,
        }

}

/**
 * Method that returns a vector with all of the messages a user in sender or recipient for
 * @param sender: the sender of a message (user logged in)
 * @param connection: database connection
 *
 * @return returns all of the messages
 */
pub fn all_user_messages(user: Uuid, connection: &PgConnection) -> QueryResult<Vec<UserTimestamp>> {
    // Get vector of all matching messages
    let messages = messages::table
                      .filter(messages::sender.eq(user))
                      .or_filter(messages::recipient.eq(user))
                      .load::<DbMessage>(&*connection);

    // Pattern match to make sure successful, convert to DisplayMessages if so
    match messages {
        Ok(msgs) => {
                // Filter into a set so no duplicates
                let mut users = HashMap::new();

                // Iterate through messages, insert if newer timestamp
                for m in msgs{
                    let u = if m.sender.eq(&user) {m.recipient} else {m.sender};

                    match users.get(&u){
                        Some(n) => if m.timestamp > *n {users.insert(u, m.timestamp);} else {()},
                        None => {users.insert(u, m.timestamp); ()},
                    }
                }

                let mut pq = priority_queue::PriorityQueue::new();
            
                // Sort UserTimestamps by hotness using pq (greatest NaiveDateTime value)
                for (k,v) in users.iter() {
                    pq.push(k, v);
                }  

                // Create a vector with all of the reviews to as ordered
                let mut ordered : Vec<UserTimestamp> = vec![];

                // Order by timestamp
                for (user, timestamp) in pq.into_sorted_iter() {

                    ordered.push(UserTimestamp{
                        user: super::super::users::handlers::get_username_from_uuid(*user, connection),
                        timestamp: *timestamp,
                    });
                }

                Ok(ordered)
                },
        Err(e) => Err(e),
    }
}



/**
 * Method that returns a vector with all of the messages between
 * two users
 * @param sender: the sender of a message (user logged in)
 * @param recipient: the person user is chatting with
 *
 * @return returns all of the messages
 */
pub fn all_messages(sender: Uuid, recipient: Uuid, connection: &PgConnection) -> QueryResult<Vec<DisplayMessage>> {
    // Get vector of all matching messages
    let messages = messages::table
                      .filter(messages::sender.eq_any(vec![sender, recipient]))
                      .filter(messages::recipient.eq_any(vec![sender, recipient]))
                      .load::<DbMessage>(&*connection);


    // Pattern match to make sure successful, convert to DisplayMessages if so
    match messages {
        Ok(r) => Ok(r.iter()
                     .map(|msg| to_message(msg, sender, connection))
                     .collect()),
        Err(e) => Err(e),
    }
}


/**
 * CREATE MESSAGE: Method that attempts to create a new message in database, returns URL? 
 */
pub fn insert(message: Message, connection: &PgConnection) -> QueryResult<usize> {
    // Prints the Message information that was received (register)
    println!("Text: {}", message.text);
    println!("Recipient: {}", message.recipient);

    // Inserts message into database, returns uuid generated
    diesel::insert_into(messages::table)
        .values(from_message(message, connection))
        .execute(connection)
}

/*
/**
 * LOAD MESSAGE: Method that returns a DbMessage given the uuid
 */
pub fn get(id: Uuid, connection: &PgConnection) -> QueryResult<DbMessage> {

    // Searches message table for the uuid and gets the message
    messages::table.find(id).get_result::<DbMessage>(connection)
}


/**
 * DELETE Message: Method that removes a message in database
 */
pub fn delete(id: Uuid, connection: &PgConnection) -> QueryResult<usize> {
    diesel::delete(messages::table.find(id))
        .execute(connection)
}
*/

// Struct representing the fields of a user and timestamp (for getting messagers)
#[derive(std::hash::Hash, std::cmp::Eq, std::cmp::PartialEq, Queryable, Serialize, Deserialize)]
pub struct UserTimestamp {
    pub user: String, //token
    pub timestamp: NaiveDateTime, //recipient username
}

// Struct representing the fields of a message passed in from frontend contains
#[derive(Queryable, Serialize, Deserialize)]
pub struct Message {
    pub sender: String, //token
    pub recipient: String, //recipient username
    pub text: String,
}

// Struct representing the fields of a message inserted into db contains
#[derive(Insertable, Queryable, Serialize, Deserialize)]
#[table_name = "messages"]
pub struct InsertMessage {
    pub sender: Uuid, //token
    pub recipient: Uuid, //recipient username
    pub text: String,
}

// Struct represneting the fields of a message that is retrieved from db
#[derive(Insertable, AsChangeset, Queryable, Serialize, Deserialize)]
#[table_name = "messages"]
pub struct DbMessage {
    pub sender: Uuid, 
    pub recipient: Uuid, 
    pub text: String,
    pub timestamp: NaiveDateTime,
    pub pkey: i64,
}

// Struct representing the fields of a message inserted into db contains
#[derive(Queryable, Serialize, Deserialize, std::hash::Hash, std::cmp::PartialEq, std::cmp::Eq)]
pub struct DisplayMessage {
    pub is_sender: bool,
    pub text: String,
    pub timestamp: NaiveDateTime,
}