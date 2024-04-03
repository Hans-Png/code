import consola from "consola";
import { Badge, Card, Col, Container, ListGroup, Row } from "react-bootstrap";
import { useI18n } from "react-simple-i18n";
import { useAppStore } from "../../hooks/AppContext";
import type { ResultRoute } from "../../types/flightroute";

const ResultBox = () => {
  const { t, i18n } = useI18n();
  const { state } = useAppStore();
  const { resultRoutes } = state;

  const itemInfo = (routeData: ResultRoute, index: number) => {
    const { from, to, route, isTo, isVisaRequired } = routeData;
    const { distance, time } = route;

    const title = `${from.iata} - ${to.iata}`;
    const timeInHours = Math.floor(time / 60);
    const timeInMinutes = time % 60;
    const isDomestic = from.country.code === to.country.code;
    consola.info(to.country.code);

    return (
      <Card className="mt-1 md-1" key={index}>
        <Card.Header>
          <h5>{title}</h5>
          {isDomestic
            ? <Badge className="me-1" bg="primary">{t("result.domestic")}</Badge>
            : <Badge className="me-1" bg="warning">{t("result.intl")}</Badge>}
          {isVisaRequired && <Badge bg="danger">{t("result.visaRequired")}</Badge>}
        </Card.Header>
        <Card.Body>
          <Row>
            <Col xs={6} className="text-start">
              <small className="fw-bold">{t("result.distance.title")}</small>
              <p className="mb-0">
                <small className="fw-lighter">
                  {t("result.distance.content", distance.toString())}
                </small>
              </p>
            </Col>
            <Col xs={6} className="text-start">
              <small className="fw-bolder">{t("result.time.title")}</small>
              <p className="mb-0">
                <small className="fw-light">
                  {t("result.time.content", timeInHours.toString(), timeInMinutes.toString())}
                </small>
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  };

  return (
    <Container className="overflow-auto">
      <ListGroup className="overflow-auto mt-2 md-1">
        {resultRoutes.map((route, index) => (
          itemInfo(route, index)
        ))}
      </ListGroup>
    </Container>
  );
};

export default ResultBox;
