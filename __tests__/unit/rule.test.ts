/* eslint-disable @typescript-eslint/no-unused-vars */
import { type DataCache, type RuleConfig, type RuleRequest, type RuleResult } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import {
  DatabaseManagerMock,
  determineOutcome,
  LoggerServiceMock,
  MockDatabaseManagerFactory,
  MockLoggerServiceFactory,
} from '@tazama-lf/frms-coe-lib/lib/tests/mocks';
import { handleTransaction, RuleExecutorConfig } from '../../src/rule';

const getRuleConfig = (): RuleConfig => {
  return {
    id: '084@4.0.0',
    cfg: '4.0.0',
    desc: 'Multiple accounts associated with a creditor',
    config: {
      bands: [
        {
          reason: 'Creditor has only one account',
          subRuleRef: '.01',
          upperLimit: 2,
        },
        {
          reason: 'Creditor has more one account',
          lowerLimit: 2,
          subRuleRef: '.02',
        },
      ],
      parameters: {},
      exitConditions: [],
    },
    creDtTm: '2026-09-13T09:37:04.128Z',
    updDtTm: '2026-09-13T09:37:04.128Z',
    tenantId: 'DEFAULT',
  };
};

const getMockRequest = (): RuleRequest => {
  const quote = {
    transaction: JSON.parse(
      `{"TxTp":"plant.001.002.qa1000","MsgId":"PK36SCBL0000001123456702","Payload":{"name":"Ayesha Khan","address":{"city":"Karachi","street":"42 Clifton Block 5","country":"PK","province":"Sindh","postalCode":"75600","coordinates":{"lat":24.8138,"lng":67.03}},"balance":125430.75,"contact":{"email":"ayesha.khan@example.com","phone":"+92-300-1234567","preferredMethod":"email"},"currency":"PKR","isActive":true,"openedOn":"2021-03-15","accountType":"savings","preferences":{"language":"en","notifications":{"sms":true,"push":false,"email":true},"statementFrequency":"monthly"},"accountNumber":"PK36SCBL0000001123456702"},"TenantId":"PAYSYSLABS"}`,
    ),
    networkMap: JSON.parse(
      '{}',
    ),
    DataCache: JSON.parse(
      '{}',
    ),
  };
  return quote;
};

const getMockRequestUnsuccessful = (): RuleRequest => {
  const quote = getMockRequest();
  quote.transaction.FIToFIPmtSts.TxInfAndSts.TxSts = 'RJCT';
  return quote;
};

const ruleResult: RuleResult = {
  id: '021@1.0.0',
  cfg: '1.0.0',
  tenantId: 'PAYSYSLABS',
  subRuleRef: '.err',
  reason: 'Unhandled rule result outcome',
};


const dataCache: DataCache = {
  dbtrId: 'dbtr_516c7065d75b4fcea6fffb52a9539357',
  cdtrId: 'cdtr_b086a1e193794192b32c8af8550d721d',
  dbtrAcctId: 'dbtrAcct_1fd08e408c184dd28cbaeef03bff1af5',
  cdtrAcctId: 'cdtrAcct_d531e1ba4ed84a248fe26617e79fcb64',
};

let databaseManager: DatabaseManagerMock<RuleExecutorConfig>;

let loggerService: LoggerServiceMock;
describe('Rule 021 Test', () => {
beforeEach(() => {
        loggerService = MockLoggerServiceFactory();
        loggerService.resetMock();
        databaseManager = MockDatabaseManagerFactory<RuleExecutorConfig>();
        databaseManager.resetMock();
  });
  describe('handleTransaction', () => {
    describe('Rule-021 bands Testing', () => {
let dataCache: DataCache;
        let req: RuleRequest;
        const amounts = [1000.0, 899.99, 900.0, 900.01, 1099.99, 1100.0, 1100.01];
beforeEach(() => {
        dataCache = {
            dbtrId: 'dbtr_516c7065d75b4fcea6fffb52a9539357',
            cdtrId: 'cdtr_b086a1e193794192b32c8af8550d721d',
            dbtrAcctId: 'dbtrAcct_1fd08e408c184dd28cbaeef03bff1af5',
            cdtrAcctId: 'cdtrAcct_d531e1ba4ed84a248fe26617e79fcb64',
        };
        req = getMockRequest();
      });
test(".01 result with reason of 'The creditor has received an insignificant number of transactions with the same amount in the last 24 hour", async () => {
        const dbData = [2000, 1000, 3000];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        const res = await handleTransaction(req, determineOutcome, ruleResult, loggerService, getRuleConfig(), databaseManager);
        expect(res).toEqual(
          JSON.parse(
            '{"id":"021@1.0.0", "tenantId": "PAYSYSLABS","cfg":"1.0.0","subRuleRef":".01","reason":"The creditor has received an insignificant number of transactions with the same amount in the last 24 hours"}',
          ),
        );
      });
test(".02 result with reason of 'The creditor has received a significant number of transactions with the same amount in the last 24 hours'", async () => {
        const dbData = [2000, 2022, 50000];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        const res = await handleTransaction(req, determineOutcome, ruleResult, loggerService, getRuleConfig(), databaseManager);
        expect(res).toEqual(
          JSON.parse(
            '{"id":"021@1.0.0","tenantId": "PAYSYSLABS", "cfg":"1.0.0","subRuleRef":".02","reason":"The creditor has received a significant number of transactions with the same amount in the last 24 hours"}',
          ),
        );
      });
test('.02 result omitted maxQueryRange parameter', async () => {
        const dbData = [2000, 2022, 50000];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        const rConfig = getRuleConfig();
        rConfig.config.parameters!.maxQueryRange = undefined;
        const res = await handleTransaction(req, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
        expect(res).toEqual(
          JSON.parse(
            '{"id":"021@1.0.0", "tenantId": "PAYSYSLABS","cfg":"1.0.0","subRuleRef":".02","reason":"The creditor has received a significant number of transactions with the same amount in the last 24 hours"}',
          ),
        );
      });
    });
    describe('Exit Conditions', () => {
let dataCache: DataCache;
        let req: RuleRequest;
beforeEach(() => {
        dataCache = {
            dbtrId: 'dbtr_516c7065d75b4fcea6fffb52a9539357',
            cdtrId: 'cdtr_b086a1e193794192b32c8af8550d721d',
            dbtrAcctId: 'dbtrAcct_1fd08e408c184dd28cbaeef03bff1af5',
            cdtrAcctId: 'cdtrAcct_d531e1ba4ed84a248fe26617e79fcb64',
        };
        req = getMockRequest();
      });
test(".x00 Rule return -> 'Unsuccessful transaction'", async () => {
        databaseManager._eventHistory.query.mockResolvedValue({ rows: [] });
        const req = getMockRequestUnsuccessful();
        const res = await handleTransaction(req, determineOutcome, ruleResult, loggerService, getRuleConfig(), databaseManager);
        expect(res).toEqual(
          JSON.parse('{"id":"021@1.0.0", "cfg":"1.0.0","subRuleRef":".x00","reason":"Unsuccessful transaction", "tenantId": "PAYSYSLABS"}'),
        );
      });
test(".x01 Rule return -> 'Insufficient transaction history'", async () => {
        const dbData = [1];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        const res = await handleTransaction(req, determineOutcome, ruleResult, loggerService, getRuleConfig(), databaseManager);
        expect(res).toEqual(
          JSON.parse(
            '{"id":"021@1.0.0","tenantId": "PAYSYSLABS", "cfg":"1.0.0","subRuleRef":".x01","reason":"Insufficient transaction history"}',
          ),
        );
      });
test('No RuleConfig - bands', async () => {
        const dbData = [1];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        const rConfig = getRuleConfig();
        rConfig.config.bands = undefined;
        try {
          await handleTransaction(req, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
        } catch (error) {
          expect((error as Error).message).toBe('Invalid config provided - bands not provided');
        }
      });
test('array isnt numbers', async () => {
        const dbData = ['baz', 'bar', 'foo'];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        try {
          await handleTransaction(req, determineOutcome, ruleResult, loggerService, getRuleConfig(), databaseManager);
        } catch (error) {
          expect((error as Error).message).toBe('Data error: query result type mismatch - expected [numbers]');
        }
      });
test("error return -> 'Empty result from query response'", async () => {
        databaseManager._eventHistory.query.mockResolvedValue({ rows: [] });
        try {
          await handleTransaction(req, determineOutcome, ruleResult, loggerService, getRuleConfig(), databaseManager);
        } catch (error) {
          expect((error as Error).message).toBe('Data error: irretrievable transaction history');
        }
      });
test('No exit conditions', async () => {
        const dbData = [1, 2, 3];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        try {
          const rConfig = getRuleConfig();
          rConfig.config.exitConditions = undefined;
          await handleTransaction(req, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
        } catch (error) {
          expect((error as Error).message).toBe('Invalid config provided - exitConditions not provided');
        }
      });
test('No exit conditions - bad or missing subRuleRef for ".x00"', async () => {
        databaseManager._eventHistory.query.mockResolvedValue({ rows: [] });
        try {
          const rConfig = getRuleConfig();
          const newReq = getMockRequest();
          newReq.transaction.FIToFIPmtSts.TxInfAndSts.TxSts = '.x00';
          rConfig.config.exitConditions![0].subRuleRef = '';
          rConfig.config.parameters!.maxQueryLimit = 2;
          rConfig.config.parameters!.tolerance = 0.1;
          const res = await handleTransaction(newReq, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
          expect(res).toEqual(
          JSON.parse(
            '{"id":"021@1.0.0", "tenantId": "PAYSYSLABS","cfg":"1.0.0","desc":"No description provided in rule config.","subRuleRef":".x00","reason":"Incoming transaction is unsuccessful"}',
          ),
        );
        } catch (error) {
          expect((error as Error).message).toBe('Unsuccessful transaction and no exit condition in config');
        }
      });
test('No exit conditions - bad or missing subRuleRef for ".x01"', async () => {
        const dbData = [50];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        try {
          const rConfig = getRuleConfig();
          const newReq = getMockRequest();
          rConfig.config.exitConditions![1].subRuleRef = '';
          const res = await handleTransaction(newReq, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
          expect(res).toEqual(
          JSON.parse(
            '{"id":"021@1.0.0","tenantId": "PAYSYSLABS", "cfg":"1.0.0","desc":"No description provided in rule config.","subRuleRef":".x00","reason":"Incoming transaction is unsuccessful"}',
          ),
        );
        } catch (error) {
          expect((error as Error).message).toBe('Insufficient History and no exit condition in config');
        }
      });
test('No tolerance', async () => {
        // Mocking the request of getting oldes transation timestamp
        const dbData = [1, 2, 3];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        try {
          const rConfig = getRuleConfig();
          rConfig.config.parameters!.tolerance = undefined;
          await handleTransaction(req, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
        } catch (error) {
          expect((error as Error).message).toBe('Invalid config provided - tolerance parameter not provided or invalid type');
        }
      });
test('No tolerance - not number', async () => {
        const dbData = [1, 2, 3];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        try {
          const rConfig = getRuleConfig();
          rConfig.config.parameters!.tolerance = 'zero point two';
          await handleTransaction(req, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
        } catch (error) {
          expect((error as Error).message).toBe('Invalid config provided - tolerance parameter not provided or invalid type');
        }
      });
    });
  });
});