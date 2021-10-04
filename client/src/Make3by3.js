import Cell from "./Cell";
import { useState, useEffect, useRef } from "react";
import fetch from "node-fetch";
import MoreInfo from "./MoreInfo";

const apiUrls = {
  Anime: "/api/anime",
  Games: "/api/games",
};

const defaultCells = () => [
  { isSearchOpen: false },
  { isSearchOpen: false },
  { isSearchOpen: false },
  { isSearchOpen: false },
  { isSearchOpen: false },
  { isSearchOpen: false },
  { isSearchOpen: false },
  { isSearchOpen: false },
  { isSearchOpen: false },
];

function cloneCells(cells) {
  return cells.map((cell) => {
    let copy = {};
    Object.assign(copy, cell);
    return copy;
  });
}

function Make3by3(props) {
  const [cells, setCells] = useState(defaultCells());

  const [searchText, setSearchText] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [image3by3, setImage3by3] = useState(null);
  const [options, setOptions] = useState({
    image_cover: false,
  });

  const onChangeOption = (e) => {
    let option = e.target.id.replaceAll("-", "_");
    setImage3by3(null);
    setOptions((oldOptions) => {
      let temp = {};
      Object.assign(temp, oldOptions);
      temp[option] = !temp[option];
      return temp;
    });
  };

  const downloadLink = useRef(null);

  useEffect(() => {
    setSearchText("");
    setSearchResult([]);
    setImage3by3(null);
    setCells(defaultCells());
  }, [props.mediaType]);

  const closeSearch = (e) => {
    if (e.target.className !== "Make3by3") return;

    setSearchText("");
    setSearchResult([]);
    setCells((cellsOld) => {
      cellsOld = cellsOld.map((cell) => {
        cell.isSearchOpen = false;
        return cell;
      });
      return cellsOld;
    });
  };

  const openSearch = (cellNum) => {
    setSearchText("");
    setSearchResult([]);
    setImage3by3(null);
    setCells((cellsOld) => {
      cellsOld = cellsOld.map((cell) => {
        cell.isSearchOpen = false;
        return cell;
      });
      cellsOld[cellNum].isSearchOpen = true;
      return cellsOld;
    });
  };

  useEffect(() => {
    if (searchText === "") return;

    fetch(apiUrls[props.mediaType] + "/search?q=" + searchText, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.completed && data.search_text === searchText) {
          setSearchResult(data.result);
        }
      });
  }, [searchText, props.mediaType]);

  const addItem = (item, cellNum) => {
    let temp = cloneCells(cells);
    temp[cellNum].item = item;
    temp[cellNum].item.offsetY = 0;
    temp[cellNum].item.offsetX = 0;
    temp[cellNum].isSearchOpen = false;
    setCells(temp);
  };

  const setItemImageSize = (cellNum, imgSize) => {
    if (cells[cellNum].item.imgSize !== imgSize) {
      let temp = cloneCells(cells);
      temp[cellNum].item.imgSize = imgSize;
      setCells(temp);
    }
  };

  const setItemImageOrientation = (cellNum, orientation) => {
    let temp = cloneCells(cells);
    temp[cellNum].item.imgOrientation = orientation;
    setCells(temp);
  };

  const updateImgOffset = (cellNum, offsets) => {
    setImage3by3(null);

    let temp = cloneCells(cells);
    temp[cellNum].item.offsetY = offsets.offsetY;
    temp[cellNum].item.offsetX = offsets.offsetX;
    setCells(temp);
  };

  const downloadOnClick = async () => {
    if (!cells.find((item) => !item.item)) {
      if (!image3by3) {
        let body = {};
        body.items = cells.map(({ item }) => ({
          title: item.title,
          id: item.id,
          offset_y: item.offsetY,
          offset_x: item.offsetX,
          image_size: item.imgSize,
        }));
        body.options = options;
        body.items = body.items.filter((item) => item);

        fetch(apiUrls[props.mediaType] + "/generate-3by3", {
          method: "POST",
          body: JSON.stringify(body),
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((res) => res.blob())
          .then((image) => {
            setImage3by3(URL.createObjectURL(image));
          });
      } else {
        downloadLink.current.click();
      }
    }
  };

  useEffect(() => {
    if (downloadLink.current) {
      downloadLink.current.href = image3by3;
      downloadLink.current.download = "3by3.jpeg";
    }
    if (image3by3) downloadLink.current.click();
  }, [image3by3]);

  const clearCell = (cellNum) => {
    let temp = cloneCells(cells);
    delete temp[cellNum].item;
    setCells(temp);
  };

  return (
    <div className='Make3by3' onClick={closeSearch}>
      <h1>Make {props.mediaType} 3by3</h1>
      <div className='editor-3by3' color={options.dark_background ? "black" : "white"}>
        {cells.map((cell, index) => {
          return (
            <Cell
              openSearch={openSearch}
              searchResults={searchResult}
              key={index}
              cellNum={index}
              data={cell}
              addItem={addItem}
              setSearchText={setSearchText}
              updateImgOffset={updateImgOffset}
              clearCell={clearCell}
              options={options}
              setItemImageSize={setItemImageSize}
              setItemImageOrientation={setItemImageOrientation}
            />
          );
        })}
      </div>
      <div className='editor-3by3-controls'>
        <div className='option-group'>
          <input
            type='checkbox'
            id='image-cover'
            onChange={onChangeOption}
            checked={options.image_cover}
          />
          <label htmlFor='image-cover'>Image Cover</label>
          <MoreInfo info='Turning this option on makes image cover cell leaving no empty space. You can adjust the offset.' />
        </div>
        <div className='option-group'>
          <input
            type='checkbox'
            id='dark-background'
            onChange={onChangeOption}
            checked={options.dark_background}
          />
          <label htmlFor='dark-background'>Dark Background</label>
          <MoreInfo info='Turning this option on makes the background of 3 by 3 dark... Well, like black you know... What else did you expect?' />
        </div>
        <button onClick={downloadOnClick}>Download Image</button>
      </div>
      <a style={{ display: "none" }} ref={downloadLink} href='localhost:3000'>
        download link
      </a>
    </div>
  );
}

export default Make3by3;
