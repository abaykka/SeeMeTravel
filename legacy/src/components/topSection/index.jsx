import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import fontawesome from "@fortawesome/fontawesome";
import brands from "@fortawesome/fontawesome-free-brands";

const TopSectionContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: #1756dd32;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 13%;
  z-index: 99;
`;

const Logo = styled.h1`
  margin: 0;
  color: #fff;
  font-weight: 800;
  font-size: 80px;
  @media screen and (max-width: 1080px) {
    text-align: center;
  }
`;

const Slogan = styled.h4`
  margin: 0;
  color: #fff;
  font-weight: 700;
  font-size: 30px;
  margin-top: 10px;
  @media screen and (max-width: 1080px) {
    text-align: center;
    margin-top: 30px;
  }
`;

const Paragraph = styled.p`
  margin: 0;
  margin-top: 3em;
  color: #fff;
  font-size: 18px;
  line-height: 1.5;
  font-weight: 500;
  max-width: 30%;
  text-align: center;
  @media screen and (max-width: 1080px) {
    max-width: 80%;
  }
`;

const Button = styled.button`
  outline: none;
  border: none;
  background-color: #27b927;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  border-radius: 8px;
  padding: 8px 2em;
  margin-top: 3em;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 350ms ease-in-out;

  &:hover {
    background-color: transparent;
    border: 2px solid #27b927;
  }
`;

const MadeBy = styled.h3`
  color: #fff;
  position: fixed;
  margin: 0 2px;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);

  @media screen and (max-width: 1080px) {
    bottom: 40px;
  }
`;
fontawesome.library.add(brands);
export function TopSection() {
  const navigate = useNavigate();
  return (
    <TopSectionContainer>
      <Logo>See Me Travel</Logo>
      <Slogan>Share your travel story with the World</Slogan>
      <Paragraph>
        “The world is a book and those who do not travel read only one page.” ~
        Saint Augustine.
      </Paragraph>
      <Button onClick={() => navigate("/create")}>Begin</Button>

      <MadeBy>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            maxWidth: "100%",
          }}
        >
          <a
            className="btn btn-primary"
            style={{ backgroundColor: "#333333" }}
            href="https://www.github.com/kappassov/SeeMeTravel"
            role="button"
            target="_blank"
          >
            <i className="fab fa-github"></i>
          </a>
          <a
            className="btn btn-primary"
            style={{ backgroundColor: "#0082ca" }}
            href="https://www.linkedin.com/in/kappassov"
            role="button"
            target="_blank"
          >
            <i className="fab fa-linkedin-in"></i>
          </a>
        </div>
      </MadeBy>
    </TopSectionContainer>
  );
}
