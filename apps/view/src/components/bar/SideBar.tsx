import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import MenuBar from "../info/MenuBar";
import ResultBox from "../info/ResultBox";
import SearchBox from "../info/SearchBox";

const SideBar = () => {
  return (
    <Container className="mt-3">
      <Row>
        <MenuBar />
      </Row>
      <Row className="overflow-auto mh-45">
        <Col className="search-container">
          <SearchBox />
        </Col>
      </Row>
      <hr />
      <Row className="overflow-auto mh-45">
        <Col className="result-container">
          <ResultBox />
        </Col>
      </Row>
    </Container>
  );
};

export default SideBar;
