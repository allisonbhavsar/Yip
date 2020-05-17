import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Image from 'react-bootstrap/Image';
import likeIcon from '../../assets/like.png';
import dislikeIcon from '../../assets/dislike.png';

class KennelCard extends Component {
    constructor(props){
        super(props);
    }

    render() {
        return (
            <Container className="pb-5">
                <Row>
                    <Col></Col>

                    <Col xs={10} className="text-center">
                        <div className="logInForm">
                                <div className="logInLabel">
                                    <Container>
                                        <Row>
                                            <Col>
                                                <h4 className="text-left pt-2 pl-2"><a class="profileLink" href={`/kennel-${this.props.kennelName}`}>{this.props.kennelName}</a></h4>
                                            </Col>
                                        </Row>
                                    </Container>
                                </div>
                                <Form className="logInEntryContainer">
                                    <div className="logInEntryContainer">
                                        <p>{this.props.kennelRules}</p>
                                    </div>
                                    <Container>
                                        <Row>
                                            <Col>
                                                <Image onClick={this.like} className="float-left likePadding" src={likeIcon} />
                                                <Image onClick={this.dislike} className="float-left likePadding" src={dislikeIcon} />
                                            </Col>
                                            <Col>
                                            </Col>
                                        </Row>
                                    </Container>
                                </Form>
                       </div>
                    </Col>

                    <Col></Col>
                 </Row>
            </Container>
        )
    }
}

export default KennelCard;

KennelCard.propTypes = {
    kennelName: PropTypes.string.isRequired,
    kennelRules: PropTypes.string.isRequired,
}