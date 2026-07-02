import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import chokidar from 'chokidar';
import { getUsageLogPath, getUsageSummary, UsageSummaryGroup } from '../core/usage-log.js';
import { renderSummaryTable } from '../cli/format.js';

interface DashboardProps {}

const Dashboard: React.FC<DashboardProps> = () => {
  const { exit } = useApp();
  const [summary, setSummary] = useState<UsageSummaryGroup[]>([]);
  const [logPath, setLogPath] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    try {
      const activePath = getUsageLogPath();
      setLogPath(activePath);
      const data = getUsageSummary({ groupBy: 'model' });
      setSummary(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    // Initial load
    loadData();

    // Setup file watcher
    const activePath = getUsageLogPath();
    const watcher = chokidar.watch(activePath, { persistent: true, ignoreInitial: true });

    watcher.on('add', () => loadData());
    watcher.on('change', () => loadData());
    watcher.on('unlink', () => loadData());

    return () => {
      watcher.close();
    };
  }, []);

  // Exit on 'q' or 'Ctrl+C'
  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c')) {
      exit();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="round" borderColor="cyan" padding={1} flexDirection="column" width={80}>
        <Text color="cyan" bold>
          LLM Cost Estimator — Live Dashboard
        </Text>
        <Text dimColor>
          File: {logPath}
        </Text>
      </Box>

      {error ? (
        <Box marginTop={1}>
          <Text color="red">Error loading logs: {error}</Text>
        </Box>
      ) : summary.length === 0 ? (
        <Box marginTop={1} padding={1} borderStyle="single" borderColor="yellow">
          <Text color="yellow">No usage records logged yet. Run some LLM calls to see them here.</Text>
        </Box>
      ) : (
        <Box marginTop={1} flexDirection="column">
          <Text>
            {renderSummaryTable(summary)}
          </Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>
          Press <Text bold color="white">q</Text> to quit. Dashboard updates automatically when logs change.
        </Text>
      </Box>
    </Box>
  );
};

export function startDashboard(): Promise<void> {
  return new Promise((resolve) => {
    const { waitUntilExit } = render(<Dashboard />);
    waitUntilExit().then(() => {
      resolve();
    });
  });
}
