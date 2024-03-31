import React, { useState } from "react";
import { Button, Col, Container, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import { Passport } from "react-bootstrap-icons";
import { useI18n } from "react-simple-i18n";
import InfoDialog from "../dialogs/InfoDialog";

const MenuBar = () => {
  const { t } = useI18n();
  const [isShowInfoDialog, setIsShowInfoDialog] = useState<boolean>(false);

  const toggleInfoDialog = (value: boolean) => {
    setIsShowInfoDialog(value);
  };

  return (
    <Container fluid>
      <Row>
        <Col>
          <OverlayTrigger
            overlay={<Tooltip>{t("travelerInfo.title")}</Tooltip>}
          >
            <Button variant="outline-secondary" onClick={() => toggleInfoDialog(true)}>
              <Passport />
            </Button>
          </OverlayTrigger>
        </Col>
      </Row>
      <InfoDialog show={isShowInfoDialog} toggleInfoDialog={toggleInfoDialog} />
    </Container>
  );
};

export default MenuBar;
