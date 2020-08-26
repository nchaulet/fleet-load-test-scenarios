## Fleet load tests scenarios

We already have a tools to do stress tests on Fleet APIs, but these kind of test are slow and are not ideal to get quick feedback if a code change improve perfomance or not.

This project allow to run some quick load test based on cibled scenarios.

## How to run tests

You need `k6` to run these load tests

Than after just run the scenario you want and provided the required config variables

```shell
ENROLLMENT_TOKEN=cGJWdEozUUJmN3Bsbmh6VDRHZ3M6YkJUNzFNTElTc3FieTEzR3hLLUZPQQ== k6 run
```

## Scenarios

- `scenarios/agent-checkin.js` This scenario will test an agent that perform two checkin (first one is going to be longer as we create the configuration for the agent). This scenario provided two metrics `checkin_first_time_duration` and `checkin_second_time_duration`.
