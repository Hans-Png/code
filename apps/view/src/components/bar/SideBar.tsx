import React from "react";
import { Button, Col, Container, Nav, Row } from "react-bootstrap";
import InfoDialog from "../dialogs/InfoDialog";
import MenuBar from "../info/MenuBar";
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
      <Row className="overflow-auto mh-45">
        <Col className="result-container">
        </Col>
      </Row>
    </Container>
  );
};

export default SideBar;
