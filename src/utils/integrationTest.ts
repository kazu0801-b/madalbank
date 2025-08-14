import { healthApi, balanceApi, transactionApi, authApi } from './api';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: any;
}

export const runIntegrationTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  // 1. ヘルスチェックテスト
  try {
    console.log('🔍 Running health check test...');
    const healthResult = await healthApi.check();
    results.push({
      name: 'Health Check',
      success: healthResult.success,
      message: healthResult.success 
        ? `API is healthy: ${healthResult.data?.message}` 
        : `Health check failed: ${healthResult.error}`,
      data: healthResult.data,
    });
  } catch (error) {
    results.push({
      name: 'Health Check',
      success: false,
      message: `Health check error: ${error}`,
    });
  }

  // 2. 残高取得テスト
  try {
    console.log('🔍 Running balance API test...');
    const balanceResult = await balanceApi.getBalance(1);
    results.push({
      name: 'Balance API',
      success: balanceResult.success,
      message: balanceResult.success 
        ? `Balance retrieved: ${balanceResult.data?.total_balance} medals for ${balanceResult.data?.username}` 
        : `Balance API failed: ${balanceResult.error}`,
      data: balanceResult.data,
    });
  } catch (error) {
    results.push({
      name: 'Balance API',
      success: false,
      message: `Balance API error: ${error}`,
    });
  }

  // 3. 取引履歴取得テスト
  try {
    console.log('🔍 Running transaction history test...');
    const transactionsResult = await transactionApi.getTransactions(5);
    results.push({
      name: 'Transaction History',
      success: transactionsResult.success,
      message: transactionsResult.success 
        ? `Retrieved ${transactionsResult.data?.transactions?.length || 0} transactions` 
        : `Transaction history failed: ${transactionsResult.error}`,
      data: transactionsResult.data,
    });
  } catch (error) {
    results.push({
      name: 'Transaction History',
      success: false,
      message: `Transaction history error: ${error}`,
    });
  }

  // 4. 入金テスト
  try {
    console.log('🔍 Running deposit test...');
    const depositResult = await transactionApi.createTransaction({
      type: 'deposit',
      amount: 100,
      description: 'Integration test deposit',
    });
    results.push({
      name: 'Deposit Transaction',
      success: depositResult.success,
      message: depositResult.success 
        ? `Deposit successful: +${depositResult.data?.transaction?.amount} medals` 
        : `Deposit failed: ${depositResult.error}`,
      data: depositResult.data,
    });
  } catch (error) {
    results.push({
      name: 'Deposit Transaction',
      success: false,
      message: `Deposit error: ${error}`,
    });
  }

  // 5. 認証テスト
  try {
    console.log('🔍 Running auth test...');
    const authResult = await authApi.login('testuser');
    results.push({
      name: 'Authentication',
      success: authResult.success,
      message: authResult.success 
        ? `Login successful for user: ${authResult.data?.user?.username}` 
        : `Authentication failed: ${authResult.error}`,
      data: authResult.data,
    });
  } catch (error) {
    results.push({
      name: 'Authentication',
      success: false,
      message: `Authentication error: ${error}`,
    });
  }

  return results;
};

export const printTestResults = (results: TestResult[]): void => {
  console.log('\n🧪 Integration Test Results:');
  console.log('================================');
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.name}: ${result.message}`);
  });

  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`\n📊 Summary: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All integration tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check the details above.');
  }
};