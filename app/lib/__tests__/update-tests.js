// Script to update test file to use new API format
const fs = require('fs');

let content = fs.readFileSync('commute-optimizer.test.ts', 'utf8');

// Replace all mockFetchStopMonitoring with mockFetchStopTimetable
content = content.replace(/mockFetchStopMonitoring/g, 'mockFetchStopTimetable');

// Replace all mockParseStopMonitoringDepartures with mockParseStopTimetableDepartures
content = content.replace(/mockParseStopMonitoringDepartures/g, 'mockParseStopTimetableDepartures');

// Replace StopMonitoringDelivery with StopTimetableDelivery structure
content = content.replace(/ServiceDelivery: \{[^}]*StopMonitoringDelivery:[^}]*\}/g, (match) => {
  // Convert to new format
  return match
    .replace('ServiceDelivery: {', 'Siri: { ServiceDelivery: {')
    .replace('StopMonitoringDelivery', 'StopTimetableDelivery')
    .replace(/\}$/, '} }');
});

// Fix the simplified mock responses
content = content.replace(
  /ServiceDelivery: \{ StopMonitoringDelivery: \{\} \}/g,
  'Siri: { ServiceDelivery: { StopTimetableDelivery: {} } }'
);

fs.writeFileSync('commute-optimizer.test.ts', content);
console.log('Test file updated!');