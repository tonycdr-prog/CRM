import { Report } from "@shared/schema";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface PDFCertificationPageProps {
  report: Partial<Report>;
  reportId?: string;
  testCount?: number;
  passCount?: number;
  failCount?: number;
}

export default function PDFCertificationPage({ 
  report, 
  reportId,
  testCount = 0,
  passCount = 0,
  failCount = 0
}: PDFCertificationPageProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (reportId) {
      const verificationUrl = `${window.location.origin}/verify/${reportId}`;
      QRCode.toDataURL(verificationUrl, {
        width: 120,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        }
      }).then(setQrDataUrl).catch(console.error);
    }
  }, [reportId]);

  const allPassed = failCount === 0 && testCount > 0;
  const reportDate = report.reportDate ? new Date(report.reportDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

  return (
    <div className="w-[210mm] h-[297mm] bg-white p-[20mm] flex flex-col justify-between">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Test Certification & Sign-Off</h1>
          <div className="h-1 w-24 bg-primary mx-auto" />
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg p-6 space-y-4 bg-muted/20">
            <h2 className="text-lg font-semibold">Test Summary</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-background border">
                <div className="text-3xl font-bold">{testCount}</div>
                <div className="text-sm text-muted-foreground">Total Tests</div>
              </div>
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="text-3xl font-bold text-green-600">{passCount}</div>
                <div className="text-sm text-green-600">Passed</div>
              </div>
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="text-3xl font-bold text-red-600">{failCount}</div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Certification Statement</h2>
            <p className="text-sm leading-relaxed">
              I hereby certify that the tests documented in this report have been carried out in accordance with 
              the applicable UK building regulations and testing standards ({report.testingStandards || "BS EN 12101-8:2020, BSRIA BG 49/2024"}). 
              All equipment used was calibrated and functioning correctly at the time of testing. 
              The results presented are accurate to the best of my knowledge and professional judgement.
            </p>
            {allPassed ? (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm font-medium text-green-700">
                  All {testCount} test(s) have PASSED the required minimum velocity threshold.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm font-medium text-amber-700">
                  {failCount} of {testCount} test(s) did not meet the required minimum velocity threshold. 
                  Remedial action may be required.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="border rounded-lg p-6 space-y-4">
              <h3 className="font-semibold">Tester Signature</h3>
              {report.testerSignature ? (
                <div className="bg-white border rounded p-2">
                  <img 
                    src={report.testerSignature} 
                    alt="Tester Signature" 
                    className="h-20 w-full object-contain"
                  />
                </div>
              ) : (
                <div className="h-20 border-b-2 border-dashed border-muted-foreground" />
              )}
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Company: {report.companyName || "_________________"}</div>
                <div className="text-sm text-muted-foreground">Certification: {report.testerCertification || "_________________"}</div>
                <div className="text-sm text-muted-foreground">Date: {reportDate}</div>
              </div>
            </div>

            <div className="border rounded-lg p-6 space-y-4">
              <h3 className="font-semibold">Witness Signature</h3>
              {report.witnessSignature ? (
                <div className="bg-white border rounded p-2">
                  <img 
                    src={report.witnessSignature} 
                    alt="Witness Signature" 
                    className="h-20 w-full object-contain"
                  />
                </div>
              ) : (
                <div className="h-20 border-b-2 border-dashed border-muted-foreground" />
              )}
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Name: {report.witnessName || "_________________"}</div>
                <div className="text-sm text-muted-foreground">Role: Site Representative</div>
                <div className="text-sm text-muted-foreground">Date: {reportDate}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between border-t pt-6">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            This document serves as official certification of the smoke control testing conducted.
          </p>
          <p className="text-xs text-muted-foreground">
            {report.projectName && `Project: ${report.projectName}`}
            {report.projectNumber && ` | Ref: ${report.projectNumber}`}
          </p>
        </div>
        
        {qrDataUrl && reportId && (
          <div className="flex flex-col items-center">
            <img src={qrDataUrl} alt="Verification QR Code" className="w-[30mm] h-[30mm]" />
            <span className="text-xs text-muted-foreground mt-1">Scan to verify</span>
          </div>
        )}
      </div>
    </div>
  );
}
