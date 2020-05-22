import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import Form from 'react-bootstrap/Form';
import ReviewCard from './ReviewCard';
import Message from './Message';
import YipNavBar from './YipNavBar';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Image from 'react-bootstrap/Image';
import Button from 'react-bootstrap/Button';
import Jumbotron from "react-bootstrap/Jumbotron";
import LoadingIcon from '../../assets/loadingIcon.gif';
import TagCard from './TagCard';
import { Redirect } from 'react-router-dom';
import Nav from 'react-bootstrap/Nav';

import axios from 'axios'

import { followKennelJson, updateLoggedInState, isLoggedIn } from './BackendHelpers.js';

class Kennel extends Component {
    constructor(props) {
        super(props);

        this.state = {
            kennel_name: "",
            follower_count: null,
            showReviews: true,
            showRules: false,
            showTags: false,
            showReviewReports: false,
            showCommentReports: false,
            isFollowing: false,
            followBtnText: "Follow",
            reviewArray: [],
            tagsArray: [],
            reportsReviewsArray: [],
            reportsCommentsArray: [],
            rules: "",
            tagsString: "",
            mutedString: "",
            bannedString: "",
            kennelReviewsListed: false,
            kennelInfoListed: false,
            isModerator: false
        }

        this.handleSelect = this.handleSelect.bind(this);
        this.followKennel = this.followKennel.bind(this);
    }

    handleSelect(eventKey) {

        if (eventKey == "reviews") {
            this.setState({ showReviews: true, showRules: false, showTags: false, showReviewReports: false, showCommentReports: false });
        }
        if (eventKey == "rules") {
            this.setState({ showReviews: false, showRules: true, showTags: false, showReviewReports: false, showCommentReports: false });
        }
        if (eventKey == "tags") {
            this.setState({ showReviews: false, showRules: false, showTags: true, showReviewReports: false, showCommentReports: false });
        }
        if (eventKey == "reviewReports") {
            this.setState({ showReviews: false, showRules: false, showTags: false, showReviewReports: true, showCommentReports: false });
        }
        if (eventKey == "commentReports") {
            this.setState({ showReviews: false, showRules: false, showTags: false, showReviewReports: false, showCommentReports: true });
        }

    }

    followKennel() {

        updateLoggedInState(this);
        if (isLoggedIn(this)) {

            if (!this.state.isFollowing) {
                this.setState({ isFollowing: true, followBtnText: "Unfollow" });
            }
            else {
                this.setState({ isFollowing: false, followBtnText: "Follow" });
            }
        }

        // Get kennel name somehow
        var kennelName = this.props.match.params.kennelName;

        // Get token
        var token = localStorage.getItem('jwtToken');

        // Create JSON form to send to backend
        var form = followKennelJson(kennelName, token);

        // Send POST request to follow kennel
        if (!this.state.isFollowing) {
            axios({
                method: 'post',
                url: '/follow_kennel',
                data: form
            }).then(response => {

                // Successful follow
                //alert('Kennel has been followed successfully');


            }).catch(error => {

                // Error for failed follow
                //alert('Failed to follow kennel');

            });
        }
        else {
            axios({
                method: 'post',
                url: '/unfollow_kennel',
                data: form
            }).then(response => {

                // Successful follow
                //alert('Kennel has been unfollowed successfully');


            }).catch(error => {

                // Error for failed follow
                //alert('Failed to unfollow kennel');

            });

        }
    }

    componentDidMount() {

        updateLoggedInState(this);

        // Get kennel name from URL
        var kennelName = this.props.match.params.kennelName;
        var token = localStorage.getItem('jwtToken')

        // Format URL to send in GET request
        var reqUrl = "/get_kennel_reviews/" + kennelName + "/" + token;

        // Send GET request with kennel name to get reviews in kennel
        axios({
            method: 'get',
            url: reqUrl
        }).then(response => {

            // Iterate through reviews
            if (!this.kennelReviewsListed) {

                for (var i = 0; i < response.data.length; i++) {

                    // Add review name, reviewer's username, review text to reviewArray
                    this.state.reviewArray.push({
                        title: response.data[i].title,
                        author: response.data[i].author,
                        text: response.data[i].text,
                        kennel: response.data[i].kennel_name,
                        rating: response.data[i].rating,
                        id: response.data[i].review_uuid,
                        isLiked: response.data[i].is_liked,
                        isDisliked: response.data[i].is_disliked
                    });

                }
                this.setState({ kennelReviewsListed: true });
            }

            // Renders reviews
            this.forceUpdate();

        }).catch(error => {

            // Review not found in database
            alert('Kennel does not exist/No reviews in kennel');

        });

        // Get token 
        var token = localStorage.getItem('jwtToken');

        // Format URL to send in GET request
        reqUrl = "/get_kennel/" + kennelName + "/" + token;

        // Send GET request with kennel name to get kennel information
        axios({
            method: 'get',
            url: reqUrl
        }).then(response => {

            // alert('Kennel info successfully grabbed from database!');
            // console.log(response.data);

            // Updates kennel name
            this.setState({
                kennel_name: response.data.kennel_name,
                follower_count: response.data.follower_count,
                rules: response.data.rules
            });

            if (response.data.is_following) {
                this.setState({ isFollowing: true, followBtnText: "Unfollow" });
            }

            // Iterate through tags
            var tagsStr = "";
            if (response.data.tags.length > 0) {
                tagsStr = tagsStr + response.data.tags[0];
                this.state.tagsArray.push(response.data.tags[0]);
            }
            for (var i = 1; i < response.data.tags.length; i++) {

                // Add tags to tagsArray and recreate tag string as prop for editkennel
                tagsStr = tagsStr + ", " + response.data.tags[i];
                this.state.tagsArray.push(response.data.tags[i]);
            }

            var mutedStr = "";
            if (response.data.muted_words.length > 0) {
                mutedStr = mutedStr + response.data.muted_words[0];
            }
            for (var i = 1; i < response.data.muted_words.length; i++) {

                // Build muted words string from array as prop for editkennel
                mutedStr = mutedStr + ", " + response.data.muted_words[i];

            }

            /*var bannedStr = "";
            if(response.data.bans.length > 0) {
                bannedStr = bannedStr + response.data.bans[0];
            } 
            for (var i = 1; i < response.data.muted_bans.length; i++) {
                
                // Build muted words string from array as prop for editkennel
                bannedStr = bannedStr + ", " + response.data.bans[i];
    
            }*/

            this.setState({ tagsString: tagsStr });
            this.setState({ mutedString: mutedStr });
            //this.setState({ bannedString: bannedStr });
            this.setState({ kennelInfoListed: true });
            this.setState({ isModerator: response.data.is_moderator });

        }).catch(error => {

            // Review not found in database
            alert('Kennel does not exist in database');

        });


        // Get token 
        var token = localStorage.getItem('jwtToken');

        // Format URL to send in GET request
        reqUrl = "/get_kennel_reports_reviews/" + kennelName + "/" + token;

        // Send GET request with kennel name to get kennel information
        axios({
            method: 'get',
            url: reqUrl
        }).then(response => {
            console.log(response.data);

            if (response.data.length > 0) {
                this.state.reportsReviewsArray.push(response.data[0]);
            }
            for (var i = 1; i < response.data.length; i++) {
                this.state.reportsReviewsArray.push(response.data[i]);
            }

        }).catch(error => {

            // Review not found in database
            alert('Review Report error');

        });

        // Get token 
        var token = localStorage.getItem('jwtToken');

        // Format URL to send in GET request
        reqUrl = "/get_kennel_reports_comments/" + kennelName + "/" + token;

        // Send GET request with kennel name to get kennel information
        axios({
            method: 'get',
            url: reqUrl
        }).then(response => {
            console.log(response.data);

            // Iterate through tags
            if (response.data.length > 0) {
                this.state.reportsCommentsArray.push(response.data[0]);
            }
            for (var i = 1; i < response.data.length; i++) {

                this.state.reportsCommentsArray.push(response.data[i]);
            }

        }).catch(error => {

            // Review not found in database
            alert('Comment Report error');

        });
    }

    render() {

        // Renders content for Reviews and Tags tabs
        const reviews = this.state.reviewArray.map(function (review) {
            return <ReviewCard reviewId={review.id} reviewName={review.title} reviewerName={review.author} reviewPreview={{ __html: review.text }}
                kennelName={review.kennel} rating={review.rating} />
        });
        const tags = this.state.tagsArray.map(function (tag) {
            return <TagCard tag={tag} />
        });
        const reviewReports = this.state.reportsReviewsArray.map(function (report) {
            return <Message messageText={report.reason} messagerName={report.author} timestamp={report.timestamp} reportTitle={report.title} commentBody="" reviewId={report.review_uuid} reportId={report.report_id} kennelName={report.kennel_name} />
        });
        let nameOfKennel = this.state.kennel_name;
        const commentReports = this.state.reportsCommentsArray.map(function (report) {
            return <Message messageText={report.reason} messagerName={report.author_name} timestamp={report.timestamp} reportTitle="" commentBody={report.text} reviewId="" reportId={report.report_id} kennelName={nameOfKennel} />
        });

        // Determines what to display based on which tab selected
        let kennelContent;
        if (this.state.showReviews) {
            kennelContent = reviews;
        }
        if (this.state.showRules) {
            kennelContent = this.state.rules;
        }
        if (this.state.showTags) {
            kennelContent = tags;
        }
        if (this.state.showReviewReports) {
            kennelContent = reviewReports;
        }
        if (this.state.showCommentReports) {
            kennelContent = commentReports;
        }


        // Renders either kennel or loading screen
        let kennel;
        if (this.state.kennelInfoListed && this.state.kennelReviewsListed) {
            kennel = <Container>
                <Row className="align-items-center">
                    <Col xs={9} className="text-center">
                        <Jumbotron id="jumbotron" className="text-left">
                            <h1>{this.state.kennel_name}</h1>
                            <h4>{this.state.follower_count} Followers</h4>
                            <Nav onSelect={this.handleSelect} defaultActiveKey="reviews" variant="tabs" as="ul">
                                <Nav.Item as="li">
                                    <Nav.Link eventKey="reviews">Reviews</Nav.Link>
                                </Nav.Item>
                                <Nav.Item as="li">
                                    <Nav.Link eventKey="rules">Rules</Nav.Link>
                                </Nav.Item>
                                <Nav.Item as="li">
                                    <Nav.Link eventKey="tags">Tags</Nav.Link>
                                </Nav.Item>
                                {this.state.isModerator &&
                                    <>
                                        <Nav.Item as="li">
                                            <Nav.Link eventKey="reviewReports">Reported Reviews</Nav.Link>
                                        </Nav.Item>
                                        <Nav.Item as="li">
                                            <Nav.Link eventKey="commentReports">Reported Comments</Nav.Link>
                                        </Nav.Item>
                                    </>
                                }
                            </Nav>
                        </Jumbotron>
                    </Col>
                    <Col>
                        {/*If isModerator then render the Edit Kennel Button*/}
                        {this.state.isModerator &&
                            <Link to={{
                                pathname: "/editkennel",
                                state: {
                                    rules: this.state.rules,
                                    tags: this.state.tagsString,
                                    mutedWords: this.state.mutedString,
                                    kennel_name: this.state.kennel_name
                                }
                            }}><Button className="logInEntry" variant="link">Edit Kennel</Button></Link>
                        }
                        <Button onClick={this.followKennel} className="logInEntry" type="submit" variant="primary">{this.state.followBtnText}</Button>
                        <Link to={{
                            pathname: "/createreview",
                            state: {
                                kennel_name: this.state.kennel_name
                            }
                        }}><Button className="logInEntry" type="submit" variant="link">Post Review</Button></Link>
                    </Col>
                </Row>
                <div>{kennelContent}</div>
            </Container>
        } else {
            kennel = <Row>
                <Image className="mx-auto loadingIcon loading" src={LoadingIcon}></Image>
            </Row>;
        }

        // Kennel page
        return (
            <div>
                <YipNavBar />
                {kennel}
            </div>
        )
    }
}

export default Kennel;