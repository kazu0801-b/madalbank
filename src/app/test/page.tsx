'use client';

import { useState } from 'react';
import Link from 'next/link';
import { runIntegrationTests } from '@/utils/integrationTest';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: unknown;
}

export default function TestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});

  const handleRunTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      const testResults = await runIntegrationTests();
      setResults(testResults);
    } catch (error) {
      console.error('Test execution error:', error);
      setResults([{
        name: 'Test Execution',
        success: false,
        message: `Failed to run tests: ${error}`,
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleDetails = (testName: string) => {
    setShowDetails(prev => ({
      ...prev,
      [testName]: !prev[testName],
    }));
  };

  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            🧪 MedalBank 統合テスト
          </h1>
          <p className="text-gray-600 mb-6">
            フロントエンドとバックエンドの接続をテストします
          </p>
          
          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isRunning ? '🔄 テスト実行中...' : '🚀 統合テスト実行'}
          </button>

          {results.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  📊 テスト結果: {passedTests}/{totalTests}
                </h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  passedTests === totalTests 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {passedTests === totalTests ? '🎉 全テスト成功' : '⚠️ 一部失敗'}
                </div>
              </div>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg border p-4 ${
                  result.success ? 'border-green-200' : 'border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">
                      {result.success ? '✅' : '❌'}
                    </span>
                    <h3 className="font-semibold text-gray-800">
                      {result.name}
                    </h3>
                  </div>
                  {Boolean(result.data && result.data !== null && typeof result.data === 'object') && (
                    <button
                      onClick={() => toggleDetails(result.name)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {showDetails[result.name] ? '詳細を隠す' : '詳細を表示'}
                    </button>
                  )}
                </div>
                
                <p className={`text-sm ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </p>

                {Boolean(showDetails[result.name] && result.data && result.data !== null && typeof result.data === 'object') && (
                  <div className="mt-3 p-3 bg-gray-100 rounded border">
                    <h4 className="text-xs font-semibold text-gray-600 mb-2">
                      レスポンスデータ:
                    </h4>
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            📋 テスト項目
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• ヘルスチェック - バックエンドサーバーの稼働確認</li>
            <li>• 残高API - ユーザーの残高取得テスト</li>
            <li>• 取引履歴 - 過去の取引データ取得テスト</li>
            <li>• 入金処理 - 新規取引作成テスト</li>
            <li>• 認証機能 - ログイン機能テスト</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}