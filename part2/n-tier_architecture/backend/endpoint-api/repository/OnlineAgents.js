const sql = require("mssql");
const env = require("../env");
const sqlConfig = require("../sqlConfig")[env];

/**
 *
 * @param {String} code
 * @returns
 */
async function getOnlineAgentByAgentCode(code) {
  const client = await sql.connect(sqlConfig);
  return client.query`select * from OnlineAgents oa WHERE oa.agent_code = ${code}`;
}

/**
 *
 * @param {{ AgentCode: string; AgentName: string; IsLogin: string; AgentStatus: string; }} payload
 * @returns
 */
async function createAgents(payload) {
  const client = await sql.connect(sqlConfig);
  return client.query`insert into OnlineAgents (agent_code, AgentName, IsLogin, AgentStatus) VALUES (${payload.AgentCode},${payload.AgentName},${payload.IsLogin},${payload.AgentStatus})`;
}

/**
 *
 * @param {{ AgentCode: string; AgentName: string; IsLogin: string; AgentStatus: string; }} payload
 * @returns
 */
async function updateAgents(payload) {
  const client = await sql.connect(sqlConfig);
  return client.query`update OnlineAgents set agent_code = ${payload.AgentCode}, AgentName = ${payload.AgentName}, IsLogin = ${payload.IsLogin}, AgentStatus = ${payload.AgentStatus} WHERE agent_code = ${payload.AgentCode}`;
}

module.exports = {
  getOnlineAgentByAgentCode,
  createAgents,
  updateAgents,
};
