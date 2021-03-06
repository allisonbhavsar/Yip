import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Redirect } from 'react-router-dom';
import ImageLoader from './ImageLoader';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
import corgiImage from '../../assets/corgi_shadow.png';
import Spinner from 'react-bootstrap/Spinner';
import Toast from 'react-bootstrap/Toast';
import axios from 'axios';
import { createReviewJson } from './BackendHelpers.js';

class CreateReview extends Component {

  constructor(props) {
    super(props);

    this.state = {
      pictures: [],
      kennelId: null,
      tags: [],
      checkedTags: [],
      redirect: null,
      validated: false,
      loading: false,
      showPopup: null
    };
    this.onDrop = this.onDrop.bind(this);
    this.postReview = this.postReview.bind(this);
    this.handleCheck = this.handleCheck.bind(this);
  }

  componentDidMount() {
    var kennelName = this.props.location.state.kennel_name;
    var token = localStorage.getItem('jwtToken');

    // Format URL to send in GET request
    var reqUrl = "/get_kennel/" + kennelName + "/" + token;

    // Send GET request with kennel name to get kennel information
    axios({
      method: 'get',
      url: reqUrl
    }).then(response => {

      // Gets kennel id
      this.setState({ kennelId: response.data.kennel_uuid, tags: response.data.tags });
    }).catch(error => {
      this.setState({ showPopup: 'Kennel does not exist in database' });
    });
  }

  onDrop(picture) {
    this.setState({
      pictures: picture
    });
  }

  handleCheck(index, event) {
    this.state.checkedTags[index] = event.target.checked;
  }

  postReview() {

    event.preventDefault();
    event.stopPropagation();

    var reviewForm = event.currentTarget;

    // Displays error if fields are empty
    if (reviewForm.checkValidity() === false) {
      this.setState({ validated: true });
      return;
    }

    this.setState({ loading: true });

    // Read information in forms
    var title = document.getElementById('title').value;
    var text = document.getElementById('text').value;
    text = text.replace(/(?:\r\n|\r|\n)/g, '<br \/>');    // Replaces newlines with html new line
    var user = localStorage.getItem('jwtToken');

    var form = createReviewJson(this.state.kennelId, title, text, user);

    // Create form data for POST request and stringify json
    const fd = new FormData();
    fd.append('review', JSON.stringify(form));
    // Iterate through all pictures adding image/name to form
    for (var idx = 0; idx < this.state.pictures.length; idx++) {

      // Append current image/name
      fd.append('image', this.state.pictures[idx]);
      fd.append('name', this.state.pictures[idx].name);

    }

    for (var i = 0; i < this.state.checkedTags.length; i++) {
      if (this.state.checkedTags[i]) {
        fd.append('tag', this.state.tags[i]);
      }
    }

    // Send POST request with review multipart
    axios({
      method: 'post',
      url: '/create_review/' + user,
      data: fd
    }).then(response => {

      // Redirect to review after successfully posting
      this.setState({ redirect: `/review-${response.data}` });

    }).catch(error => {

      // Failed to create review
      this.setState({
        showPopup: 'Review creation failed',
        loading: false
      });

    });


  }

  render() {
    let loading = <div></div>;
    if (this.state.loading) {
      loading = <Spinner className="logInEntryContainer" animation="border" size="sm"></Spinner>;
    }

    let selectTagsTitle;
    if (this.state.tags.length > 0) {
      selectTagsTitle = <h4 style={{ paddingTop: '20' }}>Select Tags</h4>;
    }

    let tagCheckboxes = this.state.tags.map((tag, index) => (
      <div key={`default-checkbox`} className="mb-3">
        <Form.Check
          type="checkbox"
          id={tag}
          label={`${tag}`}
          onChange={this.handleCheck.bind(this, index)}
        />
      </div>
    ))

    if (this.state.redirect) {
      return <Redirect to={this.state.redirect} />
    }

    else {
      return (
        <Container>
          <Row className="align-items-center">
            <Toast className="mx-auto smallPopup" onClose={() => this.setState({ showPopup: null })} show={this.state.showPopup} autohide>
              <Toast.Header className="smallPopup">
                <strong className="mx-auto">{this.state.showPopup}</strong>
              </Toast.Header>
            </Toast>
            <Col className="text-center">
              <Link to="/"><img src={corgiImage} /></Link>
              <div className="logInForm">
                <h1 className="logInLabel">Create Review</h1>
                <Form noValidate validated={this.state.validated} className="logInEntryContainer" onSubmit={this.postReview}>
                  <div className="logInEntryContainer">
                    <Form.Control id="kennel" className="logInEntry" size="lg" type="text" readOnly defaultValue={this.props.location.state.kennel_name} />
                  </div>
                  <div className="logInEntryContainer">
                    <Form.Control id="title" className="logInEntry" size="lg" type="text" placeholder="Title" required />
                    <Form.Control.Feedback type="invalid">Review title required.</Form.Control.Feedback>
                  </div>
                  <div className="logInEntryContainer">
                    <Form.Control id="text" className="logInEntry" size="lg" as="textarea" placeholder="Enter Review Description" required />
                    <Form.Control.Feedback type="invalid">Review description required.</Form.Control.Feedback>
                  </div>
                  <div>
                    <Form>
                      {selectTagsTitle}
                      {tagCheckboxes}
                    </Form>
                  </div>
                  <div className="logInEntryContainer">
                    <ImageLoader withIcon={false} withPreview={true} singleImage={false} buttonText='Upload Image' onChange={this.onDrop} imgExtension={['.jpg', '.png']} maxFileSize={5242880} label={'Max File Size: 5MB File Types: jpg, png'} />
                  </div>
                  <div className="logInEntryContainer">
                    <Button className="logInEntry" variant="primary" type="submit"><div>Post{loading}</div></Button>
                    <Button className="logInEntry" onClick={this.props.history.goBack} variant="primary">Cancel</Button>
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

export default CreateReview;