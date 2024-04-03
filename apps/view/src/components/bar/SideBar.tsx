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
      <Row className="overflow-auto" style={{ maxHeight: "30vh" }}>
        <Col className="overflow-autosearch-container">
          <SearchBox />
        </Col>
      </Row>
      <hr />
      <Row className="overflow-auto" style={{ maxHeight: "55vh" }}>
        <Col className="overflow-auto result-container">
          <ResultBox />
        </Col>
      </Row>
    </Container>
  );
};

export default SideBar;
