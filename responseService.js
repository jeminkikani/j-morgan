const commonResponse = (res, statusCode, message) => {
  res.status(statusCode).json({ message });
};

const commonResponseData = (res, statusCode, message, data = null) => {
  const responseBody = {
    message,
    ...(data && { data }) // Include data only if it exists
  };
  res.status(statusCode).json(responseBody);
};

module.exports = { commonResponse, commonResponseData };
