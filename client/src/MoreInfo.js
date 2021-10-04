function MoreInfo(props) {
  return (
    <span className='more-info'>
      <span className='more-info-icon'>?</span>
      <i className='more-info-text'>
        {props.info}
      </i>
    </span>);
}

export default MoreInfo;