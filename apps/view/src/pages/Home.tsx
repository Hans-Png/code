import React from "react";
import { Alert, Col, Container, Offcanvas, Row } from "react-bootstrap";
import { useI18n } from "react-simple-i18n";
import NavBar from "../components/bar/NavBar";
import SideBar from "../components/bar/SideBar";
import MapView from "../components/map/MapView";
import { useAppStore } from "../hooks/AppContext";

const Home = () => {
  const { state, dispatch } = useAppStore();
  const { t, i18n } = useI18n();
  const [showSidebar, setShowSidebar] = React.useState(false);

  const toggleSidebar = (value: boolean) => setShowSidebar(value);

  return (
    <Container lang={i18n.getLang()} fluid>
      <Row>
        <NavBar showSidebar={showSidebar} toggleSidebar={toggleSidebar} />
      </Row>
      <Row>
        <Col lg={3} className="p-0 d-none d-lg-block">
          <Offcanvas
            show={showSidebar}
            onHide={() => toggleSidebar(false)}
            responsive="lg"
          >
            <Offcanvas.Header closeButton>{t("title")}</Offcanvas.Header>
            <Offcanvas.Body>
              <SideBar />
            </Offcanvas.Body>
          </Offcanvas>
        </Col>
        <Col xs={12} lg={9} className="p-0">
          <MapView />
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
