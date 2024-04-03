import { Container, ListGroup, ListGroupItem } from "react-bootstrap";
import { useAppStore } from "../../hooks/AppContext";

const ResultBox = () => {
  const { state } = useAppStore();
  const { resultRoutes } = state;

  const itemHeader = (route: typeof resultRoutes[0]) => {
    const { from, to } = route;
    return `${from.iata} - ${to.iata}`;
  };

  return (
    <Container>
      <ListGroup className="mt-2 md-1">
        {resultRoutes.map((route, index) => (
          <ListGroupItem key={index}>
            <Container>
              <h5>{itemHeader(route)}</h5>
            </Container>
          </ListGroupItem>
        ))}
      </ListGroup>
    </Container>
  );
};

export default ResultBox;
