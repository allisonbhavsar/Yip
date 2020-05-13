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

class EditKennel extends Component {

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

    // Prevents page from refreshing on submit
    event.preventDefault();
    event.stopPropagation();

    this.setState({ failedLogin: false });

    var registerForm = event.currentTarget;

    // Displays error if fields are empty
    if (registerForm.checkValidity() === false) {
      this.setState({ validated: true });
      return;
    }

    // Parses login form with username/email and password
    var email = document.getElementById('login').value;
    var username = document.getElementById('login').value;
    var password = document.getElementById('password').value
    var form = createUserJson(username, email, password);

    // Send POST request with username, email, and password
    axios({
      method: 'post',
      url: '/login',
      data: form
    }).then(response => {

      // Store token in local storage
      localStorage.setItem('jwtToken', response.data);

      // Redirect to home after successful login
      this.setState({ redirect: "/" });


    }).catch(error => {

      // Error for failed login
      this.setState({ failedLogin: true });
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
            
            <Col className="text-center">
              <Link to="/"><img src={corgiImage} /></Link>
              <div className="logInForm">
                <h1 className="logInLabel">Edit Kennel</h1>
                <Form noValidate validated={this.state.validated} onSubmit={this.attemptLogin} className="logInEntryContainer">
                  <div className="logInEntryContainer">
                    <Form.Label>Rules</Form.Label>
                    <Form.Control id="login" className="logInEntry" type="text" required />
                  </div>
                  <div className="logInEntryContainer">
                    <Form.Label>Tags</Form.Label>
                    <Form.Control id="login" className="logInEntry" type="text" required />
                  </div>
                  <div className="logInEntryContainer">
                    <Form.Label>Muted Words</Form.Label>
                    <Form.Control id="login" className="logInEntry" type="text" required />
                  </div>
                  <div className="logInEntryContainer">
                    <Form.Label>Banned Reviewers</Form.Label>
                    <Form.Control id="login" className="logInEntry" type="text" required />
                  </div>
                  <div className="logInEntryContainer">
                    <Button className="logInEntry" type="submit" variant="primary">Save</Button>
                  </div>
                </Form>
              </div>
            </Col>
            
          </Row>
        </Container>
      )
    }
  }

}

export default EditKennel;