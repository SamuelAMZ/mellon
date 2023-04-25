// post request helpers boiler plate

const postReq = async (data, url) => {
  // headers
  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Accept", "application/json");
  headers.append("GET", "POST", "OPTIONS");
  headers.append("Access-Control-Allow-Origin", `http://localhost:4001/`);
  headers.append("Access-Control-Allow-Credentials", "true");

  // fetch
  const req = await fetch(`http://localhost:4001${url}`, {
    mode: "cors",
    method: "POST",
    headers: headers,
    body: JSON.stringify(data),
    credentials: "include",
  });

  const serverRes = await req.json();
  return serverRes;
};

export default postReq;
