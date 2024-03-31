import React from "react";
import { Container, Dropdown, Nav, Navbar } from "react-bootstrap";
import { useI18n } from "react-simple-i18n";

const NavBar = (
  props: { showSidebar: boolean; toggleSidebar: (value: boolean) => void },
) => {
  const { t, i18n } = useI18n();
  const langList = [{ lang: "en", display: "English" }, { lang: "zh", display: "中文" }];

  const setLanguage = (langTag: string) => {
    i18n.setLang(langTag);
  };

  return (
    <React.Fragment>
      <Container className="p-0">
        <Navbar bg="danger" expand="lg" className="system-navbar justify-content-between px-3">
          <Nav.Item>
            <Navbar.Toggle
              className="d-lg-none"
              onClick={() => props.toggleSidebar(!props.showSidebar)}
              style={{ marginRight: "10px" }}
            />
            <Navbar.Brand className="fw-bold text-white d-none d-md-inline">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  className="bi bi-airplane-fill"
                  viewBox="0 0 24 24"
                >
                  <path d="M6.428 1.151C6.708.591 7.213 0 8 0s1.292.592 1.572 1.151C9.861 1.73 10 2.431 10 3v3.691l5.17 2.585a1.5 1.5 0 0 1 .83 1.342V12a.5.5 0 0 1-.582.493l-5.507-.918-.375 2.253 1.318 1.318A.5.5 0 0 1 10.5 16h-5a.5.5 0 0 1-.354-.854l1.319-1.318-.376-2.253-5.507.918A.5.5 0 0 1 0 12v-1.382a1.5 1.5 0 0 1 .83-1.342L6 6.691V3c0-.568.14-1.271.428-1.849" />
                </svg>
              </span>
              {t("title")}
            </Navbar.Brand>
          </Nav.Item>
          <Nav.Item className="ml-auto">
            <Dropdown drop={"start"}>
              <Dropdown.Toggle variant="light" id="dropdown-basic">
                {t("language")}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {langList.map((langInfo, index) => (
                  <Dropdown.Item
                    key={index}
                    onClick={() => setLanguage(langInfo.lang)}
                  >
                    {langInfo.display}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Nav.Item>
        </Navbar>
      </Container>
    </React.Fragment>
  );
};

export default NavBar;
