import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';

import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';

import homeIcon from '../../assets/home.png';
import likeIcon from '../../assets/like.png';
import dislikeIcon from '../../assets/dislike.png';
import commentIcon from '../../assets/comment.png';
import Toast from 'react-bootstrap/Toast';

import axios from 'axios'

import TimeAgo from 'timeago-react'; // var TimeAgo = require('timeago-react');


import { likeDislikeReviewJson, isLoggedIn, updateLoggedInState } from './BackendHelpers.js';

class ReviewCard extends Component {

    constructor(props) {
        super(props);

        this.state = {
            rating: 0,
            isLiked: false,
            isDisliked: false,
            loginPrompt: false,
            timestamp: "",
        }

        // Binds button handler
        this.likeReview = this.likeReview.bind(this);
        this.dislikeReview = this.dislikeReview.bind(this);
    }

    componentDidMount() {
        //alert(this.props.reviewName)
        //alert(this.props.rating)
        this.setState({
            rating: this.props.rating,
            isLiked: this.props.isLiked,
            isDisliked: this.props.isDisliked,
            timestamp: (new Date(this.props.timestamp)).toString()
        })

        updateLoggedInState(this);
    }

    dislikeReview() {
        updateLoggedInState(this);
        if(isLoggedIn(this)) {
            // If already disliked removes dislike
			if(this.state.isDisliked) {
				this.setState({ isDisliked: false, rating: this.state.rating + 1 });
			}

			// If liked remove like and add dislike
			else if(this.state.isLiked) {
				this.setState({ isLiked: false, isDisliked: true, rating: this.state.rating - 2 });
			}

			// Otherwise add dislike
			else {
				this.setState({ isDisliked: true, rating: this.state.rating - 1 });
			}

        } else {
            this.setState({loginPrompt: true});
            return;
        }

        // TODO: Get uuid of review from url probably
        //var reviewId = "92b516fd-775a-41d8-9462-df94840c9a5d";
        var reviewId = this.props.reviewId;

        // Get token
        var token = localStorage.getItem('jwtToken');

        // Create form for request
        var form = likeDislikeReviewJson(reviewId, token);

        // Send POST request
        axios({
            method: 'post',
            url: '/dislike_review',
            data: form
        }).then(response => {

            //alert('Review successfully disliked!');


        }).catch(error => {

            // Failed to dislike review
            alert('Review dislike failed');

        });
    }

    likeReview() {

        updateLoggedInState(this);
        if(isLoggedIn(this)) {
            // If already liked removes like
			if(this.state.isLiked) {
				this.setState({ isLiked: false, rating: this.state.rating - 1 });
			}

			// If disliked remove dislike and add like
			else if(this.state.isDisliked) {
				this.setState({ isDisliked: false, isLiked: true, rating: this.state.rating + 2 });
			}

			// Otherwise add like
			else {
				this.setState({ isLiked: true, rating: this.state.rating + 1 });
			}
        } else {
            this.setState({loginPrompt: true});
            return;
        }

        // TODO: Get uuid of review from url probably
        //var reviewId = "92b516fd-775a-41d8-9462-df94840c9a5d";
        var reviewId = this.props.reviewId;

        // Get token
        var token = localStorage.getItem('jwtToken');

        // Create form for request
        var form = likeDislikeReviewJson(reviewId, token);

        // Send POST request
        axios({
            method: 'post',
            url: '/like_review',
            data: form
        }).then(response => {

            //alert('Review successfully liked!');

        }).catch(error => {

            // Failed to like review
            alert('Review like failed');

        });
    } 

    render() {
        let likeIconOpacity;
		let dislikeIconOpacity;
		if(this.state.isLiked) {
			likeIconOpacity = {opacity: 1.0, cursor: 'pointer'};
		}
		else {
			likeIconOpacity = {opacity: .6, cursor: 'pointer'};
		}
		if(this.state.isDisliked) {
			dislikeIconOpacity = {opacity: 1.0, cursor: 'pointer'};
		}
		else {
			dislikeIconOpacity = {opacity: .6, cursor: 'pointer'};
		}
        return (
            <Container className="pb-5">
                <Row>
                    <Col></Col>
                    <Col xs={10} className="text-center">

                        <Toast className="mx-auto logInEntry" onClose={() => this.setState({loginPrompt: false})} show={this.state.loginPrompt}>
					        <Toast.Header className="logInLabel">
						        <strong className="mr-auto">You must sign in to like/dislike reviews</strong>
					        </Toast.Header>
					        <Toast.Body>Click <a href="/login">here</a> to sign in</Toast.Body>
				        </Toast>

                        <div className="logInForm">
                                <div className="logInLabel">
                                    <Container>
                                        <Row>
                                            <Col>
                                                <h4 className="text-left pt-2 pl-2"><a class="profileLink" href={`/review-${this.props.reviewId}`}>{this.props.reviewName}</a></h4>
                                            </Col>
                                            <Col>
                                                <h4 className="text-right pt-2 pl-2"><a class="profileLink" href={`/user-${this.props.reviewerName}`}>{this.props.reviewerName}</a></h4>
                                            </Col>
                                        </Row>
                                    </Container>
                                </div>
                                <Form className="logInEntryContainer">
                                    <div className="logInEntryContainer">
                                        <p dangerouslySetInnerHTML={this.props.reviewPreview}></p>
                                    </div>
                                </Form>
                                <div className="bottomLabel">
                                    <Container>
                                        <Row>
                                            <Col>
                                                
                                                <Image onClick={this.likeReview} style={likeIconOpacity} className="float-left likePadding" width="45" src={likeIcon} />
                                                <h4 className="float-left likePadding">{this.state.rating}</h4>
                                                <Image onClick={this.dislikeReview} style={dislikeIconOpacity} className="float-left likePadding" width="45" src={dislikeIcon} />
                                                <Link to={`/kennel-${this.props.kennelName}`}><Image className="float-right" width="40" src={homeIcon} style={{opacity: .8}}/></Link>
                                                <TimeAgo
                                                  style={{padding: "10px"}}
                                                  className="float-right"
                                                  datetime={this.state.timestamp}
                                                />

                                            </Col>
                                        </Row>
                                    </Container>
                                </div>
                       </div>
                    </Col>

                    <Col></Col>
                 </Row>
            </Container>
        )
    }
}

export default ReviewCard

ReviewCard.propTypes = {
    reviewName: PropTypes.string.isRequired,
    reviwerName: PropTypes.string.isRequired,
    reviewPreview: PropTypes.string.isRequired
}