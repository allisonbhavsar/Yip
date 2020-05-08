import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
import corgiImage from '../../assets/corgi_shadow.png';
import { Redirect } from 'react-router-dom';

import axios from 'axios'

import { createUserJson } from './BackendHelpers.js';

class Login extends Component {

  constructor(props) {
    super(props);

    this.state = {
      redirect: null,
      validated: false
    };

    // Binds button handler
    this.attemptLogin = this.attemptLogin.bind(this);
  }

  /**
   * Function handler for login submit button
   */
  attemptLogin(event) {
    var registerForm = event.currentTarget;
    if (registerForm.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
      this.setState({ validated: true });
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // Parses login form with username/email and password
    var email = document.getElementById('login').value;
    var username = document.getElementById('login').value;
    var password = document.getElementById('password').value
    var form = createUserJson(username, email, password);

    // Check if any fields empty
    // if (email === "" || password === "") {
    //   alert("Empty fields.");
    //   return;
    // }

    // Send POST request with username, email, and password
    axios({
      method: 'post',
      url: '/login',
      data: form
    }).then(response => {

      // Store token in local storage
      localStorage.setItem('jwtToken', response.data);
      this.setState({ redirect: "/" });
      alert('SUCCESSFUL LOGIN')


    }).catch(error => {

      // TODO: Indicate failed login
      // this.setState({ redirect: "/" });
      alert('Username or Password incorrect!');

    });
  }

  render() {
    if (this.state.redirect) {
      return <Redirect to={this.state.redirect} />
    }
    else {
      return (
        <Container>
          <Row className="align-items-center">
            <Col></Col>
            <Col className="text-center">
              <Link to="/"><img src={corgiImage} /></Link>
              <div className="logInForm">
                <h1 className="logInLabel">Log In</h1>
                <Form noValidate validated={this.state.validated} onSubmit={this.attemptLogin} className="logInEntryContainer">
                  <div className="logInEntryContainer">
                    <Form.Control id="login" className="logInEntry" type="text" placeholder="Username/Email" required />
                  </div>
                  <div className="logInEntryContainer">
                    <Form.Control id="password" className="logInEntry" type="password" placeholder="Password" required />
                  </div>
                  <div>
                    <Link to="/recoverpassword"><Button variant="link">Forgot Password?</Button></Link>
                  </div>
                  <div className="logInEntryContainer">
                    <Button className="logInEntry" type="submit" variant="primary" >Submit</Button>
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

}

export default Login;