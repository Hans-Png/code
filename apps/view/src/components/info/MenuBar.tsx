import React, { useEffect, useState } from "react";
import { Button, Col, Container, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import { PassportFill, PersonVcardFill } from "react-bootstrap-icons";
import { useI18n } from "react-simple-i18n";
import { useAppStore } from "../../hooks/AppContext";
import TravelDocInfoDialog from "../dialogs/TravelDocInfoDialog";
import VisaInfoDialog from "../dialogs/VisaInfoDialog";

const MenuBar = () => {
  const { t } = useI18n();
  const { state } = useAppStore();
  const { travellerInfo } = state;
  const [isShowTravelDocInfoDialog, setIsShowTravelDocInfoDialog] = useState(false);
  const [isShowVisaInfoDialog, setIsShowVisaInfoDialog] = useState(false);

  const toggleTravelInfoDialog = (value: boolean) => {
    setIsShowTravelDocInfoDialog(value);
  };

  const toggleVisaInfoDialog = (value: boolean) => {
    setIsShowVisaInfoDialog(value);
  };

  // Force open at start
  useEffect(() => {
    if (!travellerInfo.travelDocs.length) {
      toggleTravelInfoDialog(true);
    }
  }, [travellerInfo.travelDocs]);

  return (
    <Container fluid>
      <Row>
        <Col xs={2}>
          <OverlayTrigger
            overlay={<Tooltip>{t("travelerInfo.document.title")}</Tooltip>}
          >
            <Button variant="outline-secondary" onClick={() => toggleTravelInfoDialog(true)}>
              <PassportFill />
            </Button>
          </OverlayTrigger>
        </Col>
        <Col xs={2}>
          <OverlayTrigger
            overlay={<Tooltip>{t("travelerInfo.visa.title")}</Tooltip>}
          >
            <Button variant="outline-secondary" onClick={() => toggleVisaInfoDialog(true)}>
              <PersonVcardFill />
            </Button>
          </OverlayTrigger>
        </Col>
      </Row>
      <TravelDocInfoDialog show={isShowTravelDocInfoDialog} toggleDialog={toggleTravelInfoDialog} />
      <VisaInfoDialog show={isShowVisaInfoDialog} toggleDialog={toggleVisaInfoDialog} />
    </Container>
  );
};

export default MenuBar;
