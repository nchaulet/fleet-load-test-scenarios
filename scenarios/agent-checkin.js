import http from "k6/http";
import { check, group, sleep, fail } from "k6";
import { Trend } from "k6/metrics";
import { b64encode } from "k6/encoding";
import { CONFIG } from "./utils/config.js";

const CHECKIN_TIMEOUT = 60000;
const { KBN_URL, ENROLLMENT_TOKEN, VUS = 5, ITERATIONS = 50 } = CONFIG;

if (!ENROLLMENT_TOKEN) {
  throw new Error("ENROLLMENT_TOKEN must be provided");
}

export let options = {
  vus: VUS,
  iterations: ITERATIONS,
  insecureSkipTLSVerify: true,
};

const checkinFirstTimeDurationTrend = new Trend(
  "checkin_first_time_duration",
  true
);
const checkinSecondTimeDurationTrend = new Trend(
  "checkin_second_time_duration",
  true
);

/**
 * 1. enroll an agent
 * 2. perform a first checkin
 * 3. perform a second checkin
 */
export default () => {
  const enrollRes = http.post(
    `${KBN_URL}/api/ingest_manager/fleet/agents/enroll`,
    JSON.stringify({
      type: "PERMANENT",
      metadata: {
        user_provided: {},
        local: {
          elastic: { agent: { version: "7.9.0" } },
          host: { hostname: `agent-${__VU}-${__ITER}` },
        },
      },
    }),
    {
      headers: {
        "Content-type": "application/json",
        Authorization: `ApiKey ${ENROLLMENT_TOKEN}`,
        "kbn-xsrf": "xx",
      },
    }
  );

  const agent = JSON.parse(enrollRes.body).item;

  const sendCheckinRequest = () =>
    http.post(
      `${KBN_URL}/api/ingest_manager/fleet/agents/${agent.id}/checkin`,
      JSON.stringify({
        events: [],
      }),
      {
        headers: {
          "Content-type": "application/json",
          Authorization: `ApiKey ${agent.access_api_key}`,
          "kbn-xsrf": "xx",
        },
        tags: {
          operation: "checkin",
        },
        timeout: CHECKIN_TIMEOUT,
      }
    );

  const checkinRes = sendCheckinRequest();

  check(checkinRes, {
    "first checkin successfully": (resp) => resp.status === 200,
  });

  checkinFirstTimeDurationTrend.add(checkinRes.timings.duration);

  sleep(1);

  const secondCheckinRes = sendCheckinRequest();

  check(secondCheckinRes, {
    "second checkin successfully": (resp) => resp.status === 200,
  });

  checkinSecondTimeDurationTrend.add(secondCheckinRes.timings.duration);

  sleep(1);
};
