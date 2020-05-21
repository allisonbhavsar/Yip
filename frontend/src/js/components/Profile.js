import React, { Component } from 'react';
import Row from 'react-bootstrap/Row';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Jumbotron from "react-bootstrap/Jumbotron";
import Image from 'react-bootstrap/Image';
import YipNavBar from "./YipNavBar";
import LoadingIcon from '../../assets/loadingIcon.gif';
import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import ReviewCard from './ReviewCard';
import ImageUploader from 'react-images-upload';
import corgiImage from '../../assets/corgi_shadow.png';
import KennelCard from './KennelCard';

import axios from 'axios'

import { updateLoggedInState, isLoggedIn, followUserJson } from './BackendHelpers.js';

class Profile extends Component {

    constructor(props) {
        super(props)

        this.state = {
            username: "",
            showReviews: true,
            showKennels: false,
            showBookmarks: false,
            showCreatedKennels: false,
            showFollowedUsers: false,
            reviewArray: [],
            kennelArray: [],
            createdKennelArray: [],
            bookmarkArray: [],
            followedUsersArray: [],
            profileReviewsListed: false,
            profileKennelsListed: false,
            profileBookmarksListed: false,
            profileCreatedKennelsListed: false,
            profileFollowedUsersListed: false,
            isOwner: false,
            followBtnText: "Follow",
            isFollowing: false
        }

        this.handleSelect = this.handleSelect.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.followProfile = this.followProfile.bind(this);
        this.blockProfile = this.blockProfile.bind(this);
    }

    followProfile() {
        updateLoggedInState(this);

        // Update follow button text for follow/unfollow
        if(isLoggedIn(this)) {
            if (!this.state.isFollowing) {
                this.setState({
                    followBtnText: "Unfollow",
                    isFollowing: true
                });
            }
            else {
                this.setState({
                    followBtnText: "Follow",
                    isFollowing: false
                });
            }
        }

        // Load user profile (get from URL)
        var username = this.props.match.params.username;

        var token = localStorage.getItem('jwtToken');

        var form = followUserJson(username, token);

        // Send POST request with user name to follow if not already following
        if (!this.state.isFollowing) {
            axios({
                method: 'post',
                url: '/follow_user',
                data: form,
            }).then(response => {

                //alert('User successfully followed');

            }).catch(error => {

                alert('User failed to follow');

            });
        }

        // Otherwise unfollows
        else {
            axios({
                method: 'post',
                url: '/unfollow_user',
                data: form,
            }).then(response => {

                //alert('User successfully unfollowed');

            }).catch(error => {

                alert('User failed to unfollow');

            });
        }
    }

    blockProfile() {
        // Load user profile (get from URL)
        var username = this.props.match.params.username;

        var token = localStorage.getItem('jwtToken');

        var form = followUserJson(username, token);

        // Send POST request with user name to follow
        axios({
            method: 'post',
            url: '/block_user',
            data: form,
        }).then(response => {

            alert('User successfully blocked');


        }).catch(error => {

            alert('User failed to block');

        });
    }

    onDrop(picture) {
        this.setState({
            pictures: this.state.pictures.concat(picture)
        });
    }

    handleSelect(eventKey) {

        if (eventKey == "reviews") {
            this.setState({ showReviews: true, showKennels: false, showFollowedUsers: false,
                showBookmarks: false, showCreatedKennels: false });
        }
        if (eventKey == "kennels") {
            this.setState({ showReviews: false, showKennels: true, showFollowedUsers: false,
                showBookmarks: false, showCreatedKennels: false });
        }
        if (eventKey == "bookmarks") {
            this.setState({ showReviews: false, showKennels: false, showFollowedUsers: false,
                showBookmarks: true, showCreatedKennels: false });
        }
        if (eventKey == "createdkennels") {
            this.setState({ showReviews: false, showKennels: false, showFollowedUsers: false,
                showBookmarks: false, showCreatedKennels: true });
        }
        if (eventKey == "followedusers") {
            this.setState({ showReviews: false, showKennels: false, showFollowedUsers: true,
                showBookmarks: false, showCreatedKennels: false });
        }
    }


    // update this for profile
    componentDidMount() {

        updateLoggedInState(this);

        // Load user profile (get from URL)
        var username = this.props.match.params.username;

        // Get token
        var token = localStorage.getItem('jwtToken');

        axios({
            method: 'get',
            url: '/get_followed_users/' + username,
        }).then(response => {

            // TODO: Render user information
            console.log("FOLLOWED USER");
            console.log(response.data);

            this.setState({
                username: response.data.username,
                isOwner: response.data.is_owner,
            });

            for(var i = 0; i < response.data.length; i++) {
                this.state.followedUsersArray.push(response.data[i].followee);
            }

            this.setState({ profileFollowedUsersListed: true });

        }).catch(error => {

            // Review not found in database
            alert('No followed users');

        });


        // Send GET request with user name to get user information
        axios({
            method: 'get',
            url: '/get_user/' + username + '/' + token,
        }).then(response => {

            //alert('User info successfully grabbed from database!');

            // TODO: Render user information
            console.log("USER");
            console.log(response.data);

            this.setState({
                username: response.data.username,
                isOwner: response.data.is_owner,
            });

            if (response.data.is_followed) {
                this.setState({
                    followBtnText: "Unfollow",
                    isFollowing: true
                });
            }

            this.setState({ profileKennelsListed: true });

        }).catch(error => {

            // Review not found in database
            alert('User info does not exist in database');

        });

        // Send GET request with user name to get followed kennels
        axios({
            method: 'get',
            url: '/get_followed_kennels_username/' + username,
        }).then(response => {

            //alert('Users followed kennels info successfully grabbed from database!');

            console.log("FOLLOWED KENNELS");
            console.log(response.data);

            // Store followed kennels in kennelArray
            for (var i = 0; i < response.data.length; i++) {

                // Print kennels to console for now
                console.log(response.data[i]);

                var tagsStr = "";
                // Make sure there are tags in the kennel to avoid error
                if (response.data[i].tags != null){
                    if (response.data[i].tags.length > 0) {
                        tagsStr = tagsStr + response.data[i].tags[0];
                    }
                    for (var j = 1; j < response.data[i].tags.length; j++) {
                        tagsStr = tagsStr + ", " + response.data[i].tags[j];
                    }
                } else {
                    tagsStr = "None" // No tags, TODO: indicate it idk lol
                }

                // Add kennel info to array for rendering kennel cards
                this.state.kennelArray.push({
                    kennelName: response.data[i].kennel_name,
                    kennelRules: response.data[i].rules,
                    kennelTags: tagsStr,
                    followerCount: response.data[i].follower_count
                });
            }


        }).catch(error => {

            // Review not found in database
            alert('User followed kennels does not exist in database');

        });


        // Send GET request with user name to get reviews posted
        axios({
            method: 'get',
            url: '/get_user_reviews/' + username + '/' + token,
        }).then(response => {

            //alert('Users posted reviews info successfully grabbed from database!');

            console.log("POSTED REVIEWS");
            console.log(response.data);

            // Iterate through reviews
            for (var i = 0; i < response.data.length; i++) {

                // Print reviews to console for now
                console.log(response.data[i]);

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

            this.setState({ profileReviewsListed: true });

        }).catch(error => {

            // Review not found in database
            alert('User posted reviews does not exist in database');

        });

        // Send GET request with user name to get bookmarked reviews 
        axios({
            method: 'get',
            url: '/get_user_bookmarked_reviews/' + username + '/' + token,
        }).then(response => {

            // alert('Users bookmarked reviews info successfully grabbed from database!');

            console.log("BOOKMARKED REVIEWS");
            console.log(response.data);

            // Iterate through reviews
            for (var i = 0; i < response.data.length; i++) {

                // Print reviews to console for now
                console.log(response.data[i]);

                // Add review name, reviewer's username, review text to reviewArray
                this.state.bookmarkArray.push({
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

            this.setState({ profileBookmarksListed: true });

        }).catch(error => {

            // Review not found in database
            alert('User has no bookmarked reviews');

        });

        axios({
            method: 'get',
            url: '/get_created_kennels/' + token,
        }).then(response => {

            // alert('Users created kennels successfully grabbed from database!');

            console.log("CREATED KENNELS");
            console.log(response.data);

            // Store created kennels in createdKennelArray
            for (var i = 0; i < response.data.length; i++) {

                // Print kennels to console for now
                console.log(response.data[i]);

                var tagsStr = "";
                // Make sure there are tags in the kennel to avoid error
                if (response.data[i].tags != null){
                    if (response.data[i].tags.length > 0) {
                        tagsStr = tagsStr + response.data[i].tags[0];
                    }
                    for (var j = 1; j < response.data[i].tags.length; j++) {
                        tagsStr = tagsStr + ", " + response.data[i].tags[j];
                    }
                } else {
                    tagsStr = "None" // No tags, TODO: indicate it idk lol
                }
               

                // Add kennel info to array for rendering kennel cards
                this.state.createdKennelArray.push({
                    kennelName: response.data[i].kennel_name,
                    kennelRules: response.data[i].rules,
                    kennelTags: tagsStr,
                    followerCount: response.data[i].follower_count
                });
            }

            this.setState({ profileCreatedKennelsListed: true });

        }).catch(error => {

            // Review not found in database
            alert('User has no created kennels');

        });

    }


    render() {

        // Renders content cards for each tab on profile (Reviews, Kennels, Bookmarks)
        const reviews = this.state.reviewArray.map(function (review) {
            return <ReviewCard reviewId={review.id} reviewName={review.title} reviewerName={review.author} reviewPreview={{ __html: review.text }}
                kennelName={review.kennel} rating={review.rating} isLiked={review.isLiked} isDisliked={review.isDisliked} />
        });
        const kennels = this.state.kennelArray.map(function (kennel) {
            return <KennelCard kennelName={kennel.kennelName} kennelRules={kennel.kennelRules} kennelTags={kennel.kennelTags} followerCount={kennel.followerCount} />
        });
        const createdKennels = this.state.createdKennelArray.map(function (kennel) {
            return <KennelCard kennelName={kennel.kennelName} kennelRules={kennel.kennelRules} kennelTags={kennel.kennelTags} followerCount={kennel.followerCount} />
        });
        const bookmarks = this.state.bookmarkArray.map(function (review) {
            return <ReviewCard reviewId={review.id} reviewName={review.title} reviewerName={review.author} reviewPreview={{ __html: review.text }}
                kennelName={review.kennel} rating={review.rating} isLiked={review.isLiked} isDisliked={review.isDisliked} />
        });
        const users = this.state.followedUsersArray.map(function (user) {
            return <li><a href={`/user-${user}`}>{user}</a></li>
        });

        // Determines what to display based on which tab selected
        let profileContent;
        if (this.state.showReviews) {
            profileContent = reviews;
        }
        if (this.state.showKennels) {
            profileContent = kennels;
        }
        if (this.state.showBookmarks) {
            profileContent = bookmarks;
        }
        if (this.state.showCreatedKennels) {
            profileContent = createdKennels;
        }
        if(this.state.showFollowedUsers) {
            profileContent = <ul>{users}</ul>;
        }

        // Hides buttons on own profile
        let actionButtons;
        if (!this.state.isOwner) {
            actionButtons = <Col>
                <Button className="logInEntry" type="submit" variant="primary">Message</Button>
                <Button onClick={this.followProfile} className="logInEntry" type="submit" variant="primary">{this.state.followBtnText}</Button>
                <Button onClick={this.blockProfile} className="logInEntry" type="submit" variant="primary">Block</Button>
                <Button onClick={this.reportProfile} className="logInEntry" type="submit" variant="primary">Report</Button>
            </Col>;
        }

        // Renders either profile or loading screen
        let profile;
        if (this.state.profileKennelsListed && this.state.profileReviewsListed) {
            profile = <Container>
                <Row className="align-items-center">
                    <Col xs={8} className="text-center">
                        <Jumbotron id="jumbotron" className="text-left">
                            <h1>{this.state.username}</h1>
                            <Image id="img" className="profilePic" src={corgiImage} />
                            <Nav onSelect={this.handleSelect} defaultActiveKey="reviews" variant="tabs" as="ul">
                                <Nav.Item as="li">
                                    <Nav.Link eventKey="reviews">Reviews</Nav.Link>
                                </Nav.Item>
                                <Nav.Item as="li">
                                    <Nav.Link eventKey="followedusers">Followed Users</Nav.Link>
                                </Nav.Item>
                                <Nav.Item as="li">
                                    <Nav.Link eventKey="kennels">Followed Kennels</Nav.Link>
                                </Nav.Item>
                                <Nav.Item as="li">
                                    <Nav.Link eventKey="createdkennels">Created Kennels</Nav.Link>
                                </Nav.Item>
                                <Nav.Item as="li">
                                    <Nav.Link eventKey="bookmarks">Bookmarks</Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </Jumbotron>
                    </Col>
                    {actionButtons}
                </Row>
                <div>{profileContent}</div>
            </Container>
        } else {
            profile = <Row>
                <Image className="mx-auto loadingIcon loading" src={LoadingIcon}></Image>
            </Row>;
        }

        // Profile page
        return (
            <div>
                <YipNavBar />
                {profile}
            </div>
        )
    }
}

export default Profile;