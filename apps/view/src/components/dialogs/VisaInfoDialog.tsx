import React, { useEffect, useState } from "react";
import { Alert, Button, Col, Dropdown, Form, InputGroup, Modal, Row } from "react-bootstrap";
import { Trash } from "react-bootstrap-icons";
import { useI18n } from "react-simple-i18n";
import { AppActionTypes, useAppStore } from "../../hooks/AppContext";
import type { VisaInfo } from "../../types/flightroute";

const VisaInfoDialog = (
  { show, toggleDialog }: { show: boolean; toggleDialog: (value: boolean) => void },
) => {
  const { t, i18n } = useI18n();
  const { state, dispatch } = useAppStore();
  const { countries, travellerInfo } = state;
  const { visaInfos } = travellerInfo;

  // Local State
  const [heldVisaInfos, setHeldVisaInfos] = useState<
    Array<VisaInfo & { input: string }>
  >([]);
  const [isSubmittable, setIsSubmittable] = useState(false);

  // Hooks
  useEffect(() => {
    if (show) {
      const savedVisaInfos = visaInfos.map((info) => ({
        ...info,
        input: "",
      }));
      setHeldVisaInfos(savedVisaInfos);
    } else {
      setTimeout(() => {
        setHeldVisaInfos([]);
      }, 100);
    }
  }, [show, visaInfos]);

  useEffect(() => {
    const isVisaInfosValid = heldVisaInfos.every((info) => info.country !== "XXX");

    if (isVisaInfosValid) {
      setIsSubmittable(true);
    } else {
      setIsSubmittable(false);
    }
  }, [heldVisaInfos]);

  // Dialog Methods //

  const onCloseDialog = () => {
    toggleDialog(false);
  };

  const onSaveDialog = () => {
    const newVisaInfos = heldVisaInfos.map((info) => {
      const { input: _input, ...visaInfo } = info;
      return visaInfo;
    }).filter((info) => info.country !== "XXX");

    dispatch({ type: AppActionTypes.SET_VISA_INFOS, payload: newVisaInfos });
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

    return result;
  };

  const getCountryName = (code: string) => {
    const lang = i18n.getLang();
    const country = countries.find((country) => country.code === code);
    return country ? country.name[lang] : "";
  };

  // Travel Docs methods

  const addHeldVisaInfo = () => {
    const newInfo = {
      country: "XXX",
      type: "tourist",
      input: "",
    };
    setHeldVisaInfos([...heldVisaInfos, newInfo]);
  };

  const updateHeldVisaInfo = (
    index: number,
    key: "country" | "type" | "input",
    value: string,
  ) => {
    const newHeldVisaInfos = [...heldVisaInfos];
    newHeldVisaInfos[index][key] = value;
    setHeldVisaInfos(newHeldVisaInfos);
  };

  const deleteHeldVisaInfo = (index: number) => {
    const newHeldVisaInfos = [...heldVisaInfos].filter((_info, i) => i !== index);
    setHeldVisaInfos(newHeldVisaInfos);
  };

  return (
    <Modal
      size="lg"
      show={show}
      fullscreen="sm-down"
      onHide={() => toggleDialog(false)}
      centered
    >
      <Modal.Header>
        <Modal.Title>{t("travelerInfo.visa.title")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Form noValidate>
            <Row>
              <Form.Text>{t("travelerInfo.visa.description")}</Form.Text>
            </Row>
            <Row className="mt-1 md-1 p-1">
              {Boolean(heldVisaInfos.length) && (
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
                {heldVisaInfos.map((info, index) => (
                  <Row className="p-0 mt-1 md-1" style={{ marginLeft: "auto" }}>
                    <Col xs={8}>
                      <InputGroup key={index}>
                        <Dropdown>
                          <Dropdown.Toggle
                            variant="outline-secondary"
                            style={{ width: "100%" }}
                          >
                            {info.country !== "XXX" ? getCountryName(info.country) : ""}
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
                                updateHeldVisaInfo(index, "input", e.target.value)}
                              value={info.input}
                              placeholder={t("travelerInfo.document.issurance.placeholder")}
                              autoFocus
                            />
                            {filteredCountries(info.input).filter((value) =>
                              !heldVisaInfos.find((info) =>
                                info.country === value.code
                              )
                            ).map((country) => (
                              <Dropdown.Item
                                key={country.code}
                                onClick={() => updateHeldVisaInfo(index, "country", country.code)}
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
                        <option>{t("travelerInfo.visa.options.tourist")}</option>
                      </Form.Select>
                    </Col>
                    <Col xs={1}>
                      <Button
                        variant="outline-danger"
                        onClick={() => deleteHeldVisaInfo(index)}
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
            onClick={() => addHeldVisaInfo()}
          >
            {t("travelerInfo.visa.add")}
          </Button>
        </Row>
        <Row>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="danger"
          onClick={() => onCloseDialog()}
        >
          {t("travelerInfo.cancel")}
        </Button>
        <Button
          variant="primary"
          disabled={!isSubmittable}
          onClick={() => onSaveDialog()}
        >
          {t("travelerInfo.save")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default VisaInfoDialog;
