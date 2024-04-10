import React, { useEffect, useState } from "react";
import { Alert, Button, Col, Dropdown, Form, InputGroup, Modal, Row } from "react-bootstrap";
import { Trash } from "react-bootstrap-icons";
import { useI18n } from "react-simple-i18n";
import { AppActionTypes, useAppStore } from "../../hooks/AppContext";
import type { TravelDocInfo } from "../../types/flightroute";

const TravelDocInfoDialog = (
  { show, toggleDialog }: { show: boolean; toggleDialog: (value: boolean) => void },
) => {
  const { t, i18n } = useI18n();
  const { state, dispatch } = useAppStore();
  const { countries, travellerInfo } = state;
  const { travelDocs } = travellerInfo;

  // Local State
  const [travelDocsInfo, setTravelDocsInfo] = useState<
    Array<TravelDocInfo & { input: string; isDropdownToggled: boolean }>
  >(
    [],
  );
  const [isSubmittable, setIsSubmittable] = useState(false);

  // Hooks
  useEffect(() => {
    if (show) {
      const savedTravelDocs = travelDocs.map((info) => ({
        ...info,
        input: "",
        isDropdownToggled: false,
      }));
      setTravelDocsInfo(savedTravelDocs);
    } else {
      setTimeout(() => {
        setTravelDocsInfo([]);
      }, 100);
    }
  }, [show, travelDocs]);

  useEffect(() => {
    const isTravelDocsValid = travelDocsInfo.every((info) => info.nationality !== "XXX");

    if (isTravelDocsValid) {
      setIsSubmittable(true);
    } else {
      setIsSubmittable(false);
    }
  }, [travelDocsInfo]);

  // Dialog Methods //

  const onCloseDialog = () => {
    toggleDialog(false);
  };

  const onSaveDialog = () => {
    const newTravelDocsInfo = travelDocsInfo.map((info) => {
      const { input: _input, isDropdownToggled: _isDropdownToggled, ...travelDoc } = info;
      return travelDoc;
    }).filter((info) => info.nationality !== "XXX");

    dispatch({ type: AppActionTypes.SET_TRAVEL_DOCS, payload: newTravelDocsInfo });
    onCloseDialog();
  };

  // Dropdown Methods //

  const filteredCountries = (input: string) => {
    // Inputs
    const inputUpper = input.toUpperCase();
    const lang = i18n.getLang();

    // Filtered Result
    const result = countries.filter((country) => {
      const { code, altCode, name } = country;
      const codeUpper = code.toUpperCase();
      const altCodeUpper = altCode.toUpperCase();
      const engNameUpper = name["en"].toUpperCase();
      const localNameUpper = name[lang].toUpperCase();

      return (codeUpper.includes(inputUpper)
        || altCodeUpper.includes(inputUpper)
        || engNameUpper.includes(inputUpper)
        || localNameUpper.includes(inputUpper));
    });

    return result.filter((country) =>
      !travelDocsInfo.find((info) => info.nationality === country.code)
    );
  };

  const getCountryName = (code: string) => {
    const lang = i18n.getLang();
    const country = countries.find((country) => country.code === code);
    return country ? country.name[lang] : "";
  };

  // Travel Docs methods

  const addTravelDocInfo = () => {
    // XXX states for unspecified nationality, but only consider country of issurance not nationality here
    const newInfo = {
      nationality: "XXX",
      type: "Oridinary",
      input: "",
      isDropdownToggled: false,
    };
    setTravelDocsInfo([...travelDocsInfo, newInfo]);
  };

  const updateTravelDoc = (index: number, key: "nationality" | "type" | "input", value: string) => {
    const newTravelDocsInfo = [...travelDocsInfo];
    newTravelDocsInfo[index][key] = value;
    setTravelDocsInfo(newTravelDocsInfo);
  };

  const deleteTravelDoc = (index: number) => {
    const newTravelDocsInfo = [...travelDocsInfo].filter((_info, i) => i !== index);
    setTravelDocsInfo(newTravelDocsInfo);
  };

  return (
    <Modal
      size="lg"
      show={show}
      fullscreen="sm-down"
      onHide={() => toggleDialog(false)}
      backdrop={!travelDocs.length ? "static" : true}
      centered
    >
      <Modal.Header>
        <Modal.Title>{t("travelerInfo.document.title")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Form noValidate>
            {!travelDocsInfo.length && (
              <Alert className="mt-1 md-1" variant="danger">
                {t("travelerInfo.document.warning")}
              </Alert>
            )}
            <Row>
              <Form.Text>{t("travelerInfo.document.description")}</Form.Text>
            </Row>
            <Row className="mt-1 md-1 p-1">
              {Boolean(travelDocsInfo.length) && (
                <Row>
                  <Col xs={8}>
                    <Form.Label>{t("travelerInfo.document.issurance.title")}</Form.Label>
                  </Col>
                  <Col xs={4}>
                    <Form.Label>{t("travelerInfo.document.type.title")}</Form.Label>
                  </Col>
                </Row>
              )}
              <Row>
                {travelDocsInfo.map((info, index) => (
                  <Row className="p-0 mt-1 md-1" style={{ marginLeft: "auto" }}>
                    <Col xs={8}>
                      <InputGroup key={index}>
                        <Dropdown>
                          <Dropdown.Toggle
                            variant="outline-secondary"
                            style={{ width: "100%" }}
                          >
                            {info.nationality !== "XXX" ? getCountryName(info.nationality) : ""}
                          </Dropdown.Toggle>
                          <Dropdown.Menu
                            className="p-2"
                            style={{
                              maxHeight: "250px",
                              overflowY: "scroll",
                            }}
                          >
                            <Form.Control
                              onChange={(e) =>
                                updateTravelDoc(index, "input", e.target.value)}
                              value={info.input}
                              placeholder={t("travelerInfo.document.issurance.placeholder")}
                              autoFocus
                            />
                            {filteredCountries(info.input).filter((value) =>
                              !travelDocsInfo.find((info) =>
                                info.nationality === value.code
                              )
                            ).map((country) => (
                              <Dropdown.Item
                                key={country.code}
                                onClick={() => updateTravelDoc(index, "nationality", country.code)}
                              >
                                {country.name[i18n.getLang()]}
                              </Dropdown.Item>
                            ))}
                          </Dropdown.Menu>
                        </Dropdown>
                      </InputGroup>
                    </Col>
                    <Col xs={3}>
                      <Form.Select>
                        <option>{t("travelerInfo.document.type.options.ordinary")}</option>
                      </Form.Select>
                    </Col>
                    <Col xs={1}>
                      <Button
                        variant="outline-danger"
                        onClick={() => deleteTravelDoc(index)}
                      >
                        <Trash />
                      </Button>
                    </Col>
                  </Row>
                ))}
              </Row>
            </Row>
          </Form>
          <Button
            style={{ width: "auto", marginLeft: "auto", marginRight: "auto" }}
            onClick={() => addTravelDocInfo()}
          >
            {t("travelerInfo.document.add")}
          </Button>
        </Row>
        <Row>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="danger"
          disabled={!travelDocs.length || !travelDocsInfo.length}
          onClick={() => onCloseDialog()}
        >
          {t("travelerInfo.cancel")}
        </Button>
        <Button
          variant="primary"
          disabled={!isSubmittable || !travelDocsInfo.length}
          onClick={() => onSaveDialog()}
        >
          {t("travelerInfo.save")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TravelDocInfoDialog;
