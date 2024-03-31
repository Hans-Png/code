import React, { useState } from "react";
import { Button, Form, InputGroup, Modal, Row } from "react-bootstrap";
import { useI18n } from "react-simple-i18n";
import { useAppStore } from "../../hooks/AppContext";
import type { TravelDocInfo } from "../../types/flightroute";

enum VisaType {
  TOURIST = "TOURIST",
  RESIDENCE = "RESIDENCE",
  PR = "PR",
}

const InfoDialog = (
  { show, toggleInfoDialog }: { show: boolean; toggleInfoDialog: (value: boolean) => void },
) => {
  const { t, i18n } = useI18n();
  const { state, dispatch } = useAppStore();
  const { countries, travellerInfo } = state;

  // Local State
  const [travelDocsInfo, setTravelDocsInfo] = useState<TravelDocInfo[]>([{
    nationality: "XXX",
    type: "Ordinary",
  }]);
  const [isSubmittable, setIsSubmittable] = useState(false);

  const onCloseDialog = () => {
    toggleInfoDialog(false);
  };

  const addTravelDocInfo = () => {
    const newInfo: TravelDocInfo = {
      nationality: "XXX",
      type: "Ordinary",
    };
    setTravelDocsInfo((value) => [...value, newInfo]);
  };

  return (
    <Modal
      size="lg"
      show={show}
      fullscreen="sm-down"
      onHide={() => toggleInfoDialog(false)}
      centered
    >
      <Modal.Header>
        <Modal.Title>{t("travelerInfo.title")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Form noValidate>
            <Form.Label>{t("travelerInfo.document.title")}</Form.Label>
            <InputGroup>
              <Form.Label>{t("travelerInfo.document.title")}</Form.Label>
            </InputGroup>
          </Form>
        </Row>
        <Row>
          <Form noValidate>
          </Form>
        </Row>
        <Form>
          <Form.Group>
            <InputGroup>
              <Form.Label>{t("travelerInfo.document.title")}</Form.Label>
            </InputGroup>
            <InputGroup>
              <Form.Label>{t("travelerInfo.document.title")}</Form.Label>
            </InputGroup>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={() => onCloseDialog()}>
          {t("travelerInfo.cancel")}
        </Button>
        <Button variant="primary" disabled={!isSubmittable}>{t("travelerInfo.save")}</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default InfoDialog;
