/**
 * Program arguments:
 * 1 => FALLBACK_LRU true or false
 * 2 => REDIS_FAIL_ON_EXECUTION number between 0 an 101 (program exits on 100), so 101 means redis is on and does not fail
 * 3 => REDIS_FIRST_THEN_LRU true or false, true to have redis checks first then LRU if FALLBACK_LRU is true, false to have LRU checks first then Redis
 * */

import handlerRedisLru from "./app/index.mjs";
import handlerLruRedis from "./app/index-lru-first.mjs";
import asciichart from "asciichart";
import seedrandom from "seedrandom";

/* Monkey patch Math.random for test to have consistent random numbers */
/* example of first 10 numbers with this seed: 8,6,10,8,5,6,6,0,9,1 */
const rng = seedrandom(3);
Math.random = rng;

/*  Hyper Parameters */
// process.env.APP_LOG = "true"; //Uncomment to disable the application log
process.env.USER_POOL_SIZE = "10";
process.env.EXIT_ON_APP_EXECUTIONS = "100";
process.env.REDIS_UP = "true";
process.env.REDIS_FAIL_ON_EXECUTION = "50";
process.env.REDIS_CONNECT_TIMEOUT = "50";
process.env.REDIS_COMMAND_TIME = "20";
process.env.DB_FETCH_TIME = "200"; //So Redis is 10x faster than the DB fetch
process.env.FALLBACK_LRU = "false"; //Only applicable when REDIS_FIRST_THEN_LRU is true
process.env.REDIS_FIRST_THEN_LRU = "true";

/* Change defaults with command line args */
if(process.argv.length > 2)
{
  process.env.FALLBACK_LRU = process.argv[2]; //true or false
  process.env.REDIS_FAIL_ON_EXECUTION = process.argv[3]; //number as string
  process.env.REDIS_FIRST_THEN_LRU = process.argv[4]; //true or false
}


const maxAppRunCount = parseInt(process.env.EXIT_ON_APP_EXECUTIONS);
const redisFailOnAppCount = parseInt(process.env.REDIS_FAIL_ON_EXECUTION);
const maxChartPoints = maxAppRunCount;
let chartArr = {
  APP_EXECUTION_TIME: [ ]
}
let appRunCount = 0;
const startRunAt = Date.now()/1000;

let testTimeElapsed = 0;
let appTimeStart = 0;
let allAppExecutionTimes = [];
while (appRunCount < maxAppRunCount)
{
  testTimeElapsed = (Date.now()/1000) - startRunAt;
  if(process.env.APP_LOG)
  {
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.clear();
    console.log("\r\n>> APP LOG");
  }

  /* Simulate outside forces, redis goes down on the X execution of the app */
  if(appRunCount >= redisFailOnAppCount)
    process.env.REDIS_UP = "false";

  appTimeStart = Date.now();
  let handler = process.env.REDIS_FIRST_THEN_LRU === "true" ? handlerRedisLru : handlerLruRedis;
  await handler();
  let appExecutionTime = Math.round((Date.now() - appTimeStart), 2);
  process.env.APP_EXECUTION_TIME = appExecutionTime;
  allAppExecutionTimes.push(appExecutionTime);
  process.env.APP_EXECUTIONS_COUNT = ++appRunCount;
  process.env.TEST_RUN_TIME = Math.round(testTimeElapsed);

  printTestMetrics();
}


function printTestMetrics()
{
  /* If we do not want to see APP_LOG, clear here instead of beginning of execution, else cleared directly after printed */
  if(!process.env.APP_LOG)
    console.clear();

  console.log("\r\n>> APP VARIABLES");
  console.log("REDIS_GET", process.env.REDIS_GET || 0);
  console.log("REDIS_SET", process.env.REDIS_SET || 0);
  console.log("DB_FETCHES", process.env.DB_FETCHES || 0);
  console.log("LRU_SET", process.env.LRU_SET || 0);
  console.log("LRU_GET", process.env.LRU_GET || 0);

  console.log("\r\n>> TEST OUTPUTS");
  console.log("TEST_RUN_TIME (s)", process.env.TEST_RUN_TIME || 0);
  console.log("APP_EXECUTIONS_COUNT", process.env.APP_EXECUTIONS_COUNT || 0);
  console.log("APP_EXECUTION_TIME (ms)", process.env.APP_EXECUTION_TIME || 0);
  console.log("AVERAGE(APP_EXECUTION_TIME) (ms)", Math.round(allAppExecutionTimes.reduce((prev, cur) => prev + cur,0)/process.env.APP_EXECUTIONS_COUNT) || 0);

  console.log("\r\n>> CHART");
  chartArr.APP_EXECUTION_TIME.push(process.env.APP_EXECUTION_TIME || 0);
  if(chartArr.APP_EXECUTION_TIME.length > maxChartPoints)
    chartArr.APP_EXECUTION_TIME.shift();

  console.log(asciichart.plot(  new Array(chartArr.APP_EXECUTION_TIME), {height: 10} ));

  console.log("\r\n =============================================================== ");
}
