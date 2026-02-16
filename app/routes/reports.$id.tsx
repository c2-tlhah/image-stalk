/**
 * Report Detail Page
 * Displays analysis results for a specific report
 */

import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { useLoaderData, Link, useFetcher } from '@remix-run/react';
import { useState } from 'react';
import type { Env, AnalysisResult } from '~/types';
import { getReportById, getEventsByReportId } from '~/services/database';
import {
  formatBytes,
  formatDateTime,
  formatISODate,
  getConfidenceBadgeColor,
  copyToClipboard,
  downloadAsFile,
} from '~/lib/utils';
import { hexDump } from '~/services/hashing';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data || !('success' in data) || !data.success || !('report' in data)) {
    return [{ title: 'Report Not Found' }];
  }
  
  return [
    { title: `Analysis Report ${data.report.id} - ProfileImageIntel Lite` },
    { name: 'description', content: 'Image analysis and forensics report' },
  ];
};

export async function loader({ params, context }: LoaderFunctionArgs) {
  const env = context.env as Env;
  const db = env.DB;
  const reportId = params.id;
  
  if (!reportId) {
    throw new Response('Not Found', { status: 404 });
  }
  
  const report = await getReportById(db, reportId);
  
  if (!report) {
    return json({ success: false, error: 'Report not found' }, { status: 404 });
  }
  
  const events = await getEventsByReportId(db, reportId);
  const results: AnalysisResult = JSON.parse(report.results_json);
  
  return json({
    success: true,
    report: {
      id: report.id,
      input_type: report.input_type,
      source_url: report.source_url,
      final_url: report.final_url,
      created_at: report.created_at,
    },
    results,
    events: events.map((e) => ({
      id: e.id,
      checked_at: e.checked_at,
      change_type: e.change_type,
      sha256: e.sha256,
    })),
  });
}

export default function ReportDetail() {
  const data = useLoaderData<typeof loader>();
  if (!('success' in data) || !data.success || !('report' in data)) {
    throw new Error('Invalid report data');
  }
  const { report, results, events } = data;
  const fetcher = useFetcher();
  const [showSensitive, setShowSensitive] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  
  const isRechecking = fetcher.state === 'submitting';
  
  // Get the best "last updated" date from time signals
  const getLastUpdatedDate = () => {
    // Priority 1: EXIF capture time (most reliable for camera photos)
    if (results.time_signals?.exif_capture_time?.iso_value) {
      return {
        date: formatISODate(results.time_signals.exif_capture_time.iso_value),
        source: 'EXIF Capture Time',
        confidence: 100
      };
    }
    
    // Priority 2: EXIF modify time
    if (results.time_signals?.exif_modify_time?.iso_value) {
      return {
        date: formatISODate(results.time_signals.exif_modify_time.iso_value),
        source: 'EXIF DateTime',
        confidence: 100
      };
    }

    // Priority 3: Client Last Modified (for uploads without EXIF)
    if (results.time_signals?.client_last_modified?.iso_value) {
      return {
        date: formatISODate(results.time_signals.client_last_modified.iso_value),
        source: 'File Last Modified',
        confidence: 90
      };
    }

    // Priority 4: HTTP Last-Modified (for URLs)
    if (results.time_signals?.server_last_modified?.iso_value) {
       return {
         date: formatISODate(results.time_signals.server_last_modified.iso_value),
         source: 'HTTP Last-Modified',
         confidence: 70
       };
    }

    // Priority 5: Fallback to when system first analyzed it
    if (results.time_signals?.first_seen_by_system?.iso_value) {
      return {
        date: formatISODate(results.time_signals.first_seen_by_system.iso_value),
        source: 'System Analysis Time',
        confidence: 100
      };
    }
    return { date: 'No timestamp available', source: 'N/A', confidence: 0 };
  };
  
  const lastUpdated = getLastUpdatedDate();
  
  const handleRecheck = () => {
    fetcher.submit(null, {
      method: 'POST',
      action: `/api/reports/${report.id}/recheck`,
    });
  };
  
  const handleCopyHash = async (hash: string, type: string) => {
    const success = await copyToClipboard(hash);
    if (success) {
      setCopiedHash(type);
      setTimeout(() => setCopiedHash(null), 2000);
    }
  };
  
  const handleDownloadReport = () => {
    const content = JSON.stringify(results, null, 2);
    downloadAsFile(content, `report-${report.id}.json`);
  };
  
  return (
    <div className="min-h-screen scanline bg-black py-6 px-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4 flex items-center justify-between">
        <Link to="/" className="text-green-400 hover:text-green-300 font-mono text-sm">
          &lt; RETURN_TO_HOME
        </Link>
        <Link to="/guide" className="text-green-400 hover:text-green-300 font-mono text-xs border border-green-500/50 px-3 py-1">
          📚 [GUIDE]
        </Link>
      </div>
      
      {/* Main Terminal */}
      <div className="max-w-7xl mx-auto terminal-border bg-black p-4 sm:p-6">
        {/* Terminal Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-green-500 overflow-hidden">
          <div className="flex items-center space-x-3 shrink-0">
            <div className="flex space-x-2 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            </div>
            <span className="text-green-400 font-mono text-xs sm:text-sm truncate">
              [ANALYSIS_REPORT_{report.id}]
            </span>
          </div>
          <button
            onClick={handleDownloadReport}
            className="terminal-button text-[10px] sm:text-xs py-1 px-2 sm:px-3 shrink-0 ml-2"
          >
            [EXPORT_JSON]
          </button>
        </div>

        {/* Report Header Info */}
        <div className="mb-6 p-4 bg-green-500/5 border border-green-500/30">
          <div className="font-mono text-xs space-y-1">
            <p className="text-green-400">
              &gt; REPORT_ID: <span className="text-green-300">{report.id}</span>
            </p>
            <p className="text-green-400">
              &gt; TIMESTAMP: <span className="text-green-300">{formatDateTime(report.created_at)}</span>
            </p>
            <p className="text-green-400">
              &gt; INPUT_TYPE: <span className="text-green-300 uppercase">{report.input_type}</span>
            </p>
            {report.source_url && (
              <>
                <p className="text-green-400 break-all">
                  &gt; SOURCE_URL: <span className="text-green-300">{report.source_url}</span>
                </p>
                {report.final_url && report.final_url !== report.source_url && (
                  <p className="text-green-400 break-all">
                    &gt; FINAL_URL: <span className="text-green-300">{report.final_url}</span>
                  </p>
                )}
              </>
            )}
          </div>
          {report.input_type === 'url' && (
            <button
              onClick={handleRecheck}
              disabled={isRechecking}
              className="mt-3 terminal-button text-xs py-1 px-3 disabled:opacity-30"
            >
              {isRechecking ? '[RE-CHECKING...] █' : '[RE-CHECK_URL]'}
            </button>
          )}
        </div>

        {/* Image Preview & Key Info */}
        <div className="mb-6">
          <div className="text-green-400 font-mono text-sm mb-3 terminal-glow">
            [ IMAGE_PREVIEW ]  </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Image Display */}
            <div className="lg:col-span-1 bg-green-500/5 border border-green-500/30 p-4 flex items-center justify-center min-h-[16rem]">
              <img
                src={`/api/proxy-image/${report.id}`}
                alt="Analyzed image"
                className="max-w-full max-h-64 border-2 border-green-500 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-center space-y-3"><div class="text-6xl text-green-600">📄</div><p class="text-green-400 font-mono text-sm font-bold">IMAGE_UNAVAILABLE</p></div>';
                }}
              />
            </div>
            
            {/* Key Details */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="bg-green-500/5 border border-green-500/30 p-3">
                <p className="text-green-600 mb-1">FILE_TYPE:</p>
                <p className="text-green-300 text-sm">{results.metadata.file.type}</p>
              </div>
              <div className="bg-green-500/5 border border-green-500/30 p-3">
                <p className="text-green-600 mb-1">FILE_SIZE:</p>
                <p className="text-green-300 text-sm">{formatBytes(results.metadata.file.size)}</p>
              </div>
              <div className="bg-green-500/5 border border-green-500/30 p-3">
                <p className="text-green-600 mb-1">DIMENSIONS:</p>
                <p className="text-green-300 text-sm">
                  {results.metadata.dimensions.width} × {results.metadata.dimensions.height} px
                </p>
              </div>
              <div className="bg-green-500/5 border border-green-500/30 p-3">
                <p className="text-green-600 mb-1">ASPECT_RATIO:</p>
                <p className="text-green-300 text-sm">{results.metadata.dimensions.aspect_ratio}</p>
              </div>
              <div className="col-span-2 bg-green-500/10 border-2 border-green-400 p-3">
                <p className="text-green-400 mb-1 font-bold">LAST_UPDATED:</p>
                <p className="text-green-300 text-base font-bold">{lastUpdated.date}</p>
                <p className="text-green-600 text-[10px] mt-1">
                  Source: {lastUpdated.source} {lastUpdated.confidence > 0 && `(${lastUpdated.confidence}% confidence)`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* File Information Section */}
        <div className="mb-6">
          <div className="text-green-400 font-mono text-sm mb-3 terminal-glow">
            [ FILE_INFORMATION ]
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
            <div className="bg-green-500/5 border border-green-500/30 p-3">
              <p className="text-green-600">TYPE:</p>
              <p className="text-green-300">{results.metadata.file.type}</p>
            </div>
            <div className="bg-green-500/5 border border-green-500/30 p-3">
              <p className="text-green-600">MIME:</p>
              <p className="text-green-300">{results.metadata.file.mime}</p>
            </div>
            <div className="bg-green-500/5 border border-green-500/30 p-3">
              <p className="text-green-600">SIZE:</p>
              <p className="text-green-300">{formatBytes(results.metadata.file.size)}</p>
            </div>
            <div className="bg-green-500/5 border border-green-500/30 p-3">
              <p className="text-green-600">DIMENSIONS:</p>
              <p className="text-green-300">
                {results.metadata.dimensions.width} × {results.metadata.dimensions.height}
              </p>
            </div>
            <div className="bg-green-500/5 border border-green-500/30 p-3">
              <p className="text-green-600">ASPECT_RATIO:</p>
              <p className="text-green-300">{results.metadata.dimensions.aspect_ratio}</p>
            </div>
          </div>
          <div className="mt-3 bg-green-500/5 border border-green-500/30 p-3">
            <p className="text-green-600 font-mono text-xs mb-1">MAGIC_BYTES:</p>
            <code className="text-green-300 font-mono text-xs">{results.metadata.file.magic_bytes}</code>
          </div>
        </div>

        {/* Hashes Section */}
        <div className="mb-6">
          <div className="text-green-400 font-mono text-sm mb-3 terminal-glow">
            [ CRYPTOGRAPHIC_HASHES ]
          </div>
          <div className="space-y-2">
            {Object.entries(results.hashes).map(([type, hash]) => (
              <div key={type} className="bg-green-500/5 border border-green-500/30 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-green-400 font-mono text-xs uppercase mb-1">{type}:</p>
                    <code className="text-green-300 font-mono text-xs break-all">{String(hash)}</code>
                  </div>
                  <button
                    onClick={() => handleCopyHash(String(hash), type)}
                    className="ml-3 text-xs border border-green-500 text-green-400 px-2 py-1 hover:bg-green-500 hover:text-black transition-colors"
                  >
                    {copiedHash === type ? '[✓]' : '[COPY]'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Signals Section */}
        <div className="mb-6">
          <div className="text-green-400 font-mono text-sm mb-3 terminal-glow">
            [ TEMPORAL_SIGNATURES ]
          </div>
          <div className="mb-3 p-2 border border-yellow-500/50 bg-yellow-500/5">
            <p className="text-yellow-400 font-mono text-xs">
              ⚠ WARNING: Timestamps may be unreliable. EXIF data is user-editable.
            </p>
          </div>
          <div className="space-y-3">
            {Object.entries(results.time_signals).map(([key, signal]: [string, any]) => (
              <div key={key} className="bg-green-500/5 border border-green-500/30 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-green-300 font-mono text-sm font-bold mb-1">{signal.source}</p>
                    <p className="text-green-600 font-mono text-xs">{signal.reliability_note}</p>
                  </div>
                  <span className="text-xs font-mono px-2 py-1 bg-green-500 text-black whitespace-nowrap ml-3">
                    {signal.confidence_score}%
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-green-500/30">
                  <p className="text-green-400 font-mono text-base font-bold">
                    {signal.iso_value ? formatISODate(signal.iso_value) : 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HTTP Headers Section (URL only) */}
        {results.http_headers && (
          <div className="mb-6">
            <div className="text-green-400 font-mono text-sm mb-3 terminal-glow">
              [ HTTP_HEADERS ]
            </div>
            <div className="mb-3 bg-green-500/5 border border-green-500/30 p-3">
              <p className="text-green-400 font-mono text-xs">
                STATUS: <span className="text-green-300">{results.http_headers.status}</span>
              </p>
              {results.http_headers.redirect_chain.length > 1 && (
                <div className="mt-2">
                  <p className="text-green-600 font-mono text-xs">REDIRECT_CHAIN:</p>
                  <ol className="mt-1 space-y-1">
                    {results.http_headers.redirect_chain.map((url: string, idx: number) => (
                      <li key={idx} className="text-green-400 font-mono text-xs break-all pl-3">
                        [{idx + 1}] {url}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
            <div className="space-y-1">
              {Object.entries(results.http_headers.headers).map(([key, value]) => (
                <div key={key} className="bg-green-500/5 border border-green-500/30 p-2 font-mono text-xs">
                  <span className="text-green-400">{key}:</span>{' '}
                  <span className="text-green-300 break-all">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Analysis Section */}
        <div className="mb-6">
          <div className="text-green-400 font-mono text-sm mb-3 terminal-glow">
            [ CONTENT_ANALYSIS ]
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-500/5 border border-green-500/30 p-3">
              <p className="text-green-600 font-mono text-xs">BRIGHTNESS:</p>
              <p className="text-green-300 font-mono text-lg">{results.content_metrics.brightness}%</p>
            </div>
            <div className="bg-green-500/5 border border-green-500/30 p-3">
              <p className="text-green-600 font-mono text-xs">CONTRAST:</p>
              <p className="text-green-300 font-mono text-lg">{results.content_metrics.contrast}%</p>
            </div>
          </div>

          {/* Compression Analysis */}
          <div className="border-2 border-yellow-500 bg-yellow-500/10 p-4">
            <p className="text-yellow-400 font-mono text-sm mb-3">COMPRESSION_ANALYSIS:</p>
            <div className="space-y-2 font-mono text-xs">
              <p className="text-yellow-300">
                RECOMPRESSED: {results.content_metrics.compression_hints.likely_recompressed ? 'TRUE' : 'FALSE'}
              </p>
              <p className="text-yellow-300">
                CONFIDENCE: {results.content_metrics.compression_hints.confidence}%
              </p>
              <div className="mt-2">
                <p className="text-yellow-400 mb-1">NOTES:</p>
                {results.content_metrics.compression_hints.notes.map((note: string, idx: number) => (
                  <p key={idx} className="text-yellow-300 pl-3">• {note}</p>
                ))}
              </div>
              <p className="text-yellow-600 text-[10px] mt-2">
                ⚠ ALGORITHMIC ANALYSIS ONLY - NOT DEFINITIVE PROOF
              </p>
            </div>
          </div>
        </div>

        {/* EXIF Metadata Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-green-400 font-mono text-sm terminal-glow">
              [ EXIF_METADATA ]
            </div>
            {results.metadata.sensitive_data.redacted_fields.length > 0 && (
              <button
                onClick={() => setShowSensitive(!showSensitive)}
                className={`terminal-button text-xs py-1 px-3 ${showSensitive ? 'bg-red-500/20 text-red-400 border-red-500' : ''}`}
              >
                {showSensitive ? '[HIDE_SENSITIVE]' : '[SHOW_SENSITIVE]'}
              </button>
            )}
          </div>

          {results.metadata.sensitive_data.redacted_fields.length > 0 && !showSensitive && (
            <div className="mb-3 p-2 border border-yellow-500/50 bg-yellow-500/5">
              <p className="text-yellow-400 font-mono text-xs">
                ⚠ SENSITIVE DATA REDACTED (GPS, SERIAL#). Click [SHOW_SENSITIVE] to reveal.
              </p>
            </div>
          )}

          {report.input_type === 'upload' && !results.metadata.sensitive_data.has_gps && (
            <div className="mb-3 p-2 border border-orange-500/50 bg-orange-500/5">
              <p className="text-orange-400 font-mono text-xs leading-relaxed">
                📱 <strong>MOBILE UPLOAD NOTICE:</strong> If you uploaded this file from a mobile device (phone/tablet), 
                location data may have been automatically removed by your operating system's privacy protection 
                before the file reached this analyzer. This is a security feature that strips GPS coordinates when 
                sharing images from your photo gallery. To preserve metadata, transfer the original file to a desktop 
                computer before uploading.
              </p>
            </div>
          )}

          {Object.keys(results.metadata.exif).length > 0 ? (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {Object.entries(results.metadata.exif).map(([key, value]) => {
                const isSensitive = results.metadata.sensitive_data.redacted_fields.includes(key);
                return (
                  <div key={key} className={`border p-2 font-mono text-xs break-all ${isSensitive ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
                    <span className={isSensitive ? 'text-yellow-400' : 'text-green-400'}>{key}:</span>{' '}
                    <span className={isSensitive ? 'text-yellow-300' : 'text-green-300'}>
                      {isSensitive && !showSensitive ? '[REDACTED]' : String(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-green-500/5 border border-green-500/30 p-3">
              <p className="text-green-600 font-mono text-xs">NO EXIF DATA FOUND</p>
            </div>
          )}
        </div>

        {/* Change History Section (for URLs) */}
        {events.length > 0 && (
          <div>
            <div className="text-green-400 font-mono text-sm mb-3 terminal-glow">
              [ CHANGE_HISTORY ]
            </div>
            <div className="space-y-2">
              {events.map((event: any) => (
                <div key={event.id} className="bg-green-500/5 border border-green-500/30 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-300 font-mono text-xs">
                      {formatDateTime(event.checked_at)}
                    </span>
                    <span className={`px-2 py-1 text-[10px] font-mono ${
                      event.change_type === 'unchanged' ? 'bg-green-500 text-black' :
                      event.change_type === 'content_changed' ? 'bg-red-500 text-black' :
                      'bg-yellow-500 text-black'
                    }`}>
                      {event.change_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <code className="text-green-600 font-mono text-xs break-all">{event.sha256}</code>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto mt-4 text-center text-green-600 font-mono text-xs">
        <p>&gt; END OF REPORT</p>
      </div>
    </div>
  );
}
