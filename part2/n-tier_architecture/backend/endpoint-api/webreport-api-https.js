const hapi = require("@hapi/hapi");
let express = require("express");
const AuthBearer = require("hapi-auth-bearer-token");
// let fs = require("fs");
// let cors = require("cors");
const apiConfig = require("./apiconfig")["development"];
const OnlineAgent = require("./repository/OnlineAgents");
const { Server } = require("ws");
const url = require("url");

//const OnlineAgent = require('./respository/OnlineAgent');

//-------------------------------------

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const apiport = 8443;

// var url = require("url");
// const { badRequest } = require("@hapi/boom");

// //init Express
// var app = express();
// //init Express Router
// var router = express.Router();
// //var port = process.env.PORT || 87;

// //REST route for GET /status
// router.get("/status", function (req, res) {
//   res.json({
//     status: "App is running!",
//   });
// });

// //connect path to router
// app.use("/", router);

//---------------- Websocket Part1 Start -----------------------

const wsServer = new Server({
  port: process.env.WS_PORT || 3071,
});

const clientConnection = {};

wsServer.on("connection", (ws, req) => {
  // console.log(req)
  // Parse URL
  const parsed = url.parse(req.url, true);

  const { agentcode = "" } = parsed.query || {}; // { agentcode: '9998' }

  // if (!query.agentcode) {
  //   // Referer: https://github.com/Luka967/websocket-close-codes
  //   ws.disconnect(3000);
  // }

  console.log("---- new client connection ----");
  console.log(`Agent code: ${agentcode}`);

  if (!clientConnection[agentcode]) {
    console.log("New agent joined");
  } else {
    console.log("This agent already joined");
  }

  // Replace new connection
  clientConnection[agentcode] = ws;
  ws.send("NEW USER JOINED");
});

//---------------- Websocket Part1 End -----------------------

const init = async () => {
  //process.setMaxListeners(0);
  require("events").defaultMaxListeners = 0;
  process.setMaxListeners(0);

  var fs = require("fs");

  var tls = {
    key: fs.readFileSync("server.key"),
    cert: fs.readFileSync("server.crt"),
  };

  //const server = Hapi.Server({
  const server = hapi.Server({
    port: apiport,
    host: "0.0.0.0",
    tls: tls,
    //routes: {
    //    cors: true
    //}
    routes: {
      cors: {
        origin: ["*"],
        headers: [
          "Access-Control-Allow-Headers",
          "Access-Control-Allow-Origin",
          "Accept",
          "Authorization",
          "Content-Type",
          "If-None-Match",
          "Accept-language",
        ],
        additionalHeaders: [
          "Access-Control-Allow-Headers: Origin, Content-Type, x-ms-request-id , Authorization",
        ],
        credentials: true,
      },
    },
  });

  await server.register(require("@hapi/inert"));

  await server.register(AuthBearer);

  // server.ext("onPreResponse", (request, h) => {
  //   const response = request.response;

  //   // Check if the response is an error
  //   if (response.isBoom) {
  //     console.error(response);
  //     const { output } = response;
  //     return h
  //       .response({
  //         error: output.payload.message,
  //       })
  //       .code(output.statusCode);
  //   }

  //   return h.continue;
  // });

  server.auth.strategy("simple", "bearer-access-token", {
    allowQueryToken: true, // optional, false by default
    // unauthorized: () => unauthorized("Invalid Auth key."),
    validate: async (request, token, h) => {
      // here is where you validate your token
      // comparing with token from your database for example
      const isValid = token === apiConfig.serverKey;

      const credentials = { token };
      const artifacts = { test: "info" };

      return { isValid, credentials, artifacts };
    },
  });

  server.auth.default("simple");

  //-- Route ------

  server.route({
    method: "GET",
    path: "/",
    config: {
      cors: {
        origin: ["*"],
        headers: [
          "Access-Control-Allow-Headers",
          "Access-Control-Allow-Origin",
          "Accept",
          "Authorization",
          "Content-Type",
          "If-None-Match",
          "Accept-language",
        ],
        additionalHeaders: [
          "Access-Control-Allow-Headers: Origin, Content-Type, x-ms-request-id , Authorization",
        ],
        credentials: true,
      },
    },
    handler: async (request, h) => {
      try {
        //console.log('CORS request.info:');
        //console.log(request.info.cors);
        return "Test Hello, from Endpoint Web Report API.";
      } catch (err) {
        console.dir(err);
      }
    },
  });

  //-------- Your Code continue here -------------------
  server.route({
    method: "GET",
    path: "/api/v1/getOnlineAgentByAgentCode",
    config: {
      cors: {
        origin: ["*"],
        headers: [
          "Access-Control-Allow-Headers",
          "Access-Control-Allow-Origin",
          "Accept",
          "Authorization",
          "Content-Type",
          "If-None-Match",
          "Accept-language",
        ],
        additionalHeaders: [
          "Access-Control-Allow-Headers: Origin, Content-Type, x-ms-request-id , Authorization",
        ],
        credentials: true,
      },
    },
    handler: async (request, h) => {
      let param = request.query;

      if (!param?.agentcode) {
        return h
          .response({
            error: true,
            statusCode: 400,
            errMessage: "Please provide agentcode.",
          })
          .code(400);
      }

      // Query agent
      const agent = await OnlineAgent.getOnlineAgentByAgentCode(
        param.agentcode
      );
      if (agent.recordset.length === 0) {
        return h
          .response({
            error: true,
            statusCode: 404,
            errMessage: "Agent not found",
          })
          .code(404);
      }

      return {
        error: false,
        statusCode: 200,
        data: agent.recordset[0],
      };
    },
  });

  //---------------- Websocket Part2 Start -----------------------
  server.route({
    method: "POST",
    path: "/api/v1/postSendMessage",

    config: {
      payload: {
        parse: true,
        allow: ["application/json", "multipart/form-data"],
        multipart: true, // <== this is important in hapi 19
      },
      cors: {
        origin: ["*"],
        headers: [
          "Access-Control-Allow-Headers",
          "Access-Control-Allow-Origin",
          "Accept",
          "Authorization",
          "Content-Type",
          "If-None-Match",
          "Accept-language",
        ],
        additionalHeaders: [
          "Access-Control-Allow-Headers: Origin, Content-Type, x-ms-request-id , Authorization",
        ],
        credentials: true,
      },
    },
    handler: async (request, h) => {
      const { FromAgentCode, ToAgentCode, Message } = request.payload;

      if (!FromAgentCode || !ToAgentCode) {
        return h
          .response({
            error: true,
            statusCode: 400,
            errMessage: "Please provide agentcode.",
          })
          .code(400);
      }

      const agentDesination = clientConnection[ToAgentCode];

      if (!agentDesination) {
        return h
          .response({
            error: true,
            statusCode: 404,
            errMessage: "Agent not found, can not send message to agent.",
          })
          .code(404);
      }

      agentDesination.send(
        JSON.stringify({
          MessageType: "2",
          FromAgentCode: FromAgentCode,
          ToAgentCode: ToAgentCode,
          DateTime: new Date().toLocaleString("en-US"),
          Message: Message,
        })
      );

      return {
        error: false,
        statusCode: 200,
        message: "Message has been set from 9998 to 9999",
      };
    },
  });
  //---------------- Websocket Part2 End -----------------------

  server.route({
    method: "POST",
    path: "/api/v1/postOnlineAgentStatus",
    config: {
      payload: {
        parse: true,
        allow: ["application/json", "multipart/form-data"],
        multipart: true, // <== this is important in hapi 19
      },
      cors: {
        origin: ["*"],
        headers: [
          "Access-Control-Allow-Headers",
          "Access-Control-Allow-Origin",
          "Accept",
          "Authorization",
          "Content-Type",
          "If-None-Match",
          "Accept-language",
        ],
        additionalHeaders: [
          "Access-Control-Allow-Headers: Origin, Content-Type, x-ms-request-id , Authorization",
        ],
        credentials: true,
      },
    },
    handler: async (request, h) => {
      const { AgentCode, AgentName, IsLogin, AgentStatus } = request.payload;

      if (!AgentCode) {
        return h
          .response({
            error: true,
            statusCode: 400,
            errMessage: "Please provide agentcode.",
          })
          .code(400);
      }

      // Query agent
      const agent = await OnlineAgent.getOnlineAgentByAgentCode(AgentCode);
      if (agent.recordset.length === 0) {
        await OnlineAgent.createAgents({
          AgentCode,
          AgentName,
          AgentStatus: AgentStatus?.toString(),
          IsLogin: IsLogin?.toString(),
        });
        return {
          error: false,
          statusCode: 200,
          data: "Agent was inserted, status has been set also",
        };
      } else {
        await OnlineAgent.updateAgents({
          AgentCode,
          AgentName,
          AgentStatus: AgentStatus?.toString(),
          IsLogin: IsLogin?.toString(),
        });
        return {
          error: false,
          statusCode: 200,
          data: "Agent was updated",
        };
      }
    },
  });

  //----------------------------------------------

  await server.start();
  console.log("Webreport API Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
