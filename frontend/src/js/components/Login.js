import React, { Component } from 'react';
import {Link} from 'react-router-dom';

import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
import corgiImage from '../../assets/corgi_shadow.png';

import axios from 'axios' 

import { createUserJson } from './BackendHelpers.js';

class Login extends Component {

  constructor(props){
    super(props);

    // Binds button handler
    this.attemptLogin = this.attemptLogin.bind(this);
  }


  /**
   * Function handler for recovering password, MOVE TO RecoverPassword.js when ready
   */
  /*
  recoverPassword(){
    // Get the email, username, and password
    var email = document.getElementById('email').value;
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value

    var form = createUserJson(username, email, password);

    // TODO: Check if any fields empty/passwords same possibly?

    // Send POST request with username, email, and password
    axios({
      method: 'post',
      url: '/recover_password',
      data: form
    }).then((response) => {
  
      // TODO: Redirect to login screen if successful
      if ( response.data ){
  
      } else {
  
      }
      
    });
  }
  */

  /**
   * Function handler for login submit button
   */ 
  attemptLogin(){

    // Parses login form with username/email and password
    var email = document.getElementById('login').value;
    var username = document.getElementById('login').value;
    var password = document.getElementById('password').value
    var form = createUserJson(username, email, password);

    // TODO: Check if any fields empty/matching pw

    // Send POST request with username, email, and password
    axios({
      method: 'post',
      url: '/login',
      data: form
    }).then((response) => {
      
      // If successfully logged in, set access token
      if ( !(response.data == "loginfail") ){

        // Store token in local storage
        localStorage.setItem('jwtToken', response.data);

      } else {
        // TODO: Indicate failed login
        //response.data;
      }
      
    });

    
  }

  render() {
    return (
      <Container>
        <Row className="align-items-center">
          <Col></Col>
          <Col className="text-center">
            <Link to="/"><img src={corgiImage} /></Link>
            <div className="logInForm">
              <h1 className="logInLabel">Log In</h1>
              <Form className="logInEntryContainer">
                <div className="logInEntryContainer">
                  <Form.Control id="login" className="logInEntry" type="email" placeholder="Username/Email" />
                </div>
                <div className="logInEntryContainer">
                  <Form.Control id="password" className="logInEntry" type="password" placeholder="Password" />
                </div>
                <div>
                  <Link><Button variant="link">Forgot Password?</Button></Link>
                </div>
                <div className="logInEntryContainer">
                  <Button onClick={this.attemptLogin} className="logInEntry" variant="primary" >Submit</Button>
                </div>
              </Form>
            </div>
          </Col>
          <Col></Col>
        </Row>
      </Container>
    )
  }

}

export default Login;