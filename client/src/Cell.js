import { useState, useEffect, useRef } from "react";

function Cell(props) {
  const refSearchInput = useRef(null);
  const refItemImage = useRef(null);
  const refCellDiv = useRef(null);
  const [imgOffset, setImgOffset] = useState(0);

  const { setItemImageSize } = props;
  const { cellNum } = props;
  const { item } = props.data;

  const onclickHandler = () => {
    if (item) {
      props.clearCell(cellNum);
    } else if (!props.data.isSearchOpen) {
      props.openSearch(cellNum);
    }
  };

  const searchTextOnChange = (e) => {
    props.setSearchText(e.target.value);
  };

  const onWheelItem = (e) => {
    if (!item) return;

    let max;
    let min;
    let offsets = {
      offsetX: item.offsetX,
      offsetY: item.offsetY,
    };
    let newOffset;

    if (item.imgOrientation === "portrait") {
      offsets.offsetY = item.offsetY + (e.deltaY % 2) * 10;
      newOffset =
        refItemImage.current.height -
        refCellDiv.current.offsetHeight -
        offsets.offsetY;
      max = refItemImage.current.height - refCellDiv.current.offsetHeight;
    } else {
      offsets.offsetX = item.offsetX + (e.deltaY % 2) * 10;
      newOffset =
        refItemImage.current.width -
        refCellDiv.current.offsetWidth -
        offsets.offsetX;
      max = refItemImage.current.width - refCellDiv.current.offsetWidth;
    }
    min = -max;

    if (newOffset >= min && newOffset <= max)
      props.updateImgOffset(cellNum, offsets);
  };

  const onLoadItemImg = (e) => {
    let orientation =
      refItemImage.current.height > refItemImage.current.width
        ? "portrait"
        : "landscape";
    props.setItemImageOrientation(cellNum, orientation);

    if (props.options.image_cover) {
      if (orientation === "portrait") {
        setItemImageSize(cellNum, refItemImage.current.height);
        setImgOffset(refItemImage.current.height - refCellDiv.current.offsetHeight);
      } else {
        setItemImageSize(cellNum, refItemImage.current.width);
        setImgOffset(refItemImage.current.width - refCellDiv.current.offsetWidth );
      }
    }
  };

  useEffect(() => {
    if (refItemImage.current) {
      if (item.imgOrientation === "portrait") {
        setItemImageSize(cellNum, refItemImage.current.height);
      } else {
        setItemImageSize(cellNum, refItemImage.current.width);
      }
    }
  }, [setItemImageSize, cellNum, item?.imgOrientation]);

  useEffect(() => {
    if (refItemImage.current && props.options.image_cover) {
      if (item.imgOrientation === "portrait")
        setImgOffset(refItemImage.current.height - refCellDiv.current.offsetHeight - item.offsetY);
      else setImgOffset(refItemImage.current.width - refCellDiv.current.offsetWidth - item.offsetX);
    }
  }, [props.options, item?.imgOrientation, item?.offsetX, item?.offsetY]);

  // Focus to search bar when it appears
  useEffect(() => {
    if (refSearchInput.current) {
      refSearchInput.current.focus();
    }
  }, [props.data.isSearchOpen]);

  const search = () => {
    return (
      <div className='search-item-area'>
        <input
          type='text'
          className='search-item-input'
          ref={refSearchInput}
          onChange={searchTextOnChange}
        />
        <ul className='search-results'>
          {props.searchResults.map((item) => {
            return (
              <li
                className='search-results-item'
                onClick={() => props.addItem(item, cellNum)}
                key={item.id}
              >
                <img
                  className='search-results-item-picture'
                  src={item.img_url}
                  alt={item.title}
                />
                <h4 className='search-results-item-title'>{item.title}</h4>
                <button className='search-results-item-add'>Add</button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const itemImg = () => {
    let img = props.options.image_cover ? (
      <img
        onLoad={onLoadItemImg}
        ref={refItemImage}
        src={item.img_url}
        onWheel={onWheelItem}
        className={"cell-item-img img-cover-scroll " + item.imgOrientation}
        alt={item.title}
        style={
          item.imgOrientation === "portrait"
            ? { marginTop: imgOffset + "px" }
            : { marginLeft: imgOffset + "px" }
        }
      />
    ) : (
      <img
        ref={refItemImage}
        onLoad={onLoadItemImg}
        src={item.img_url}
        className={"cell-item-img " + item.imgOrientation}
        alt={item.title}
      />
    );
    return img;
  };

  return (
    <div className='Cell' onClick={onclickHandler} ref={refCellDiv}>
      {(() => {
        if (item) return itemImg();
        else if (props.data.isSearchOpen) return search();
        else return <span className='add-item-editor'></span>;
      })()}
    </div>
  );
}

export default Cell;
