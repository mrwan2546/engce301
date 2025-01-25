const hapi = require("@hapi/hapi");
let express = require("express");
const AuthBearer = require("hapi-auth-bearer-token");
let fs = require("fs");
let cors = require("cors");
const { unauthorized, badImplementation } = require("@hapi/boom");
const OnlineAgent = require("./repository/OnlineAgents");

//const OnlineAgent = require('./respository/OnlineAgent');

//-------------------------------------

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const apiport = 8443;

var url = require("url");
const { badRequest } = require("@hapi/boom");

//init Express
var app = express();
//init Express Router
var router = express.Router();
//var port = process.env.PORT || 87;

//REST route for GET /status
router.get("/status", function (req, res) {
  res.json({
    status: "App is running!",
  });
});

//connect path to router
app.use("/", router);

//----------------------------------------------

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

  server.ext("onPreResponse", (request, h) => {
    const response = request.response;

    // Check if the response is an error
    if (response.isBoom) {
      console.error(response);
      const { output } = response;
      return h
        .response({
          error: output.payload.message,
        })
        .code(output.statusCode);
    }

    return h.continue;
  });

  server.auth.strategy("simple", "bearer-access-token", {
    allowQueryToken: true, // optional, false by default
    unauthorized: () => unauthorized("Invalid Auth key."),
    validate: async (request, token, h) => {
      // here is where you validate your token
      // comparing with token from your database for example
      const isValid =
        token ===
        "1aaZ!ARgAQGuQzp00D5D000000.mOv2jmhXkfIsjgywpCIh7.HZpc6vED1LCbc90DTaVDJwdNqbTW5r4uZicv8AFfkOE1ialqnR8UN5.wnAgh090h";

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

      try {
        if (param.agentcode == null) {
          throw badRequest("Please provide agentcode.");
        }

        // Query agent
        const agent = await OnlineAgent.getOnlineAgentByAgentCode(
          param.agentcode
        );
        if (agent.recordset.length === 0) {
          return {
            error: true,
            statusCode: 404,
            errMessage: "Agent not found",
          };
        }

        return {
          error: false,
          statusCode: 200,
          data: agent.recordset[0],
        };
      } catch (err) {
        console.dir(err);
        throw badImplementation(
          "Something went wrong. Please try again later."
        );
      }
    },
  });

  server.route({
    method: "POST",
    path: "/api/v1/postOnlineAgentStatus",
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
      const { AgentCode, AgentName, IsLogin, AgentStatus } = request.payload;
      try {
        if (!AgentCode) {
          throw badRequest("Please provide agentcode.");
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
        } else {
          await OnlineAgent.updateAgents({
            AgentCode,
            AgentName,
            AgentStatus: AgentStatus?.toString(),
            IsLogin: IsLogin?.toString(),
          });
        }

        return {
          error: false,
          statusCode: 200,
          data: "Agent was inserted or updated",
        };
      } catch (err) {
        console.dir(err);
        throw badImplementation(
          "Something went wrong. Please try again later."
        );
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
