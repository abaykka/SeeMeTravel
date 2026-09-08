import React, { useState, useMemo, useContext, useEffect } from "react";
import Select from "react-select";
import countryList from "react-select-country-list";
import { CountryContext } from "../../context";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getDoc, doc, setDoc, Timestamp } from "firebase/firestore";
import { storage } from "./firebase";
import { db } from "./firebase";
import { v4 } from "uuid";
import random from "alphanumeric";

import "./index.css";

export const CountrySelector = () => {
  const [value, setValue] = useState("");
  const options = useMemo(() => countryList().getData(), []);
  const { handleChangeCountry } = useContext(CountryContext);
  const { handleDeleteCountry } = useContext(CountryContext);
  const [countriesList, setCountriesList] = useState([]);
  const [imageUpload, setImageUpload] = useState(null);
  const [imageURLs, setImageURLs] = useState([]);
  const [userId, setUserId] = useState();

  const submitUser = async () => {
    const newArr = countriesList.map((el) => el.value);
    console.log("newArray: ", newArr);
    try {
      await setDoc(doc(db, "users", userId), {
        id: userId,
        countries: newArr,
        photos: imageURLs,
        date: Timestamp.fromDate(new Date()),
      });
      console.log("Created user instance successfully with ID ", userId);
    } catch (er) {
      console.log(er);
    }
  };

  const uploadImage = async (event, value) => {
    event.preventDefault();
    if (imageUpload == null) return;
    const imageRef = ref(storage, `/${value}#${v4()}`);
    await uploadBytes(imageRef, imageUpload).then((image) => {
      getDownloadURL(image.ref).then((url) => {
        console.log("Uploaded successfully with url: ", url);

        const userObject = {
          country: value,
          url: url,
        };
        setImageURLs((prev) => [...prev, userObject]);
        console.log(imageURLs);
      });
      // getMetadata(image.ref).then((metadata) => {
      //   console.log("metadata name: ", metadata.name);
      // });
    });
  };

  const changeHandler = (value) => {
    setValue(value);
    handleChangeCountry(value);
    handleChangeCountryList(value);
  };

  const handleDeleteCountryList = (country) => {
    const newCountries = countriesList.filter(
      (el) => el.label !== country.label
    );
    setCountriesList(newCountries);
    setValue("");
    handleDeleteCountry(country);
  };

  const handleChangeCountryList = (country) => {
    setCountriesList((prevState) => [...prevState, country]);
  };

  const generateUserId = async () => {
    const id = random(5);
    // const docSnap = await getDoc(doc(db, "users", id));
    // if (docSnap.exists()) {
    //   generateUserId();
    // } else {
    //   setUserId(id);
    // }
    setUserId(id);
  };

  useEffect(() => {
    generateUserId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="controls">
      <Select options={options} value={value} onChange={changeHandler} />
      <ul>
        {countriesList.map((country) => (
          <li key={country.label}>
            <b> {country.label}</b>
            <form onSubmit={(event) => uploadImage(event, country.value)}>
              <input
                type="file"
                onChange={(event) => {
                  setImageUpload(event.target.files[0]);
                }}
              />
              <button type="submit"> Upload Photo</button>
              <span
                style={{ marginLeft: "20px", color: "red" }}
                onClick={() => {
                  handleDeleteCountryList(country);
                }}
              >
                <b>X</b>
              </span>
            </form>
          </li>
        ))}
      </ul>
      <button onClick={() => submitUser()}>CREATE MY EARTH</button>
    </div>
  );
};
