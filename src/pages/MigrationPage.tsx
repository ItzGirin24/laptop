import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { migrateFirestoreToNgrok, verifyMigration, MigrationProgress, MigrationResult } from '@/lib/data-migration';
import { Database, Cloud, ArrowRight, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function MigrationPage() {
  const { isLoading } = useData();
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [verification, setVerification] = useState<any>(null);

  const handleMigration = async () => {
    setIsMigrating(true);
    setProgress(null);
    setResult(null);
    setVerification(null);

    try {
      const migrationResult = await migrateFirestoreToNgrok((progressUpdate) => {
        setProgress(progressUpdate);
      });

      setResult(migrationResult);

      if (migrationResult.success) {
        toast.success('Migration completed successfully!');
      } else {
        toast.warning('Migration completed with some errors');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      toast.error('Migration failed completely');
      setResult({
        success: false,
        message: 'Migration failed completely',
        stats: { students: 0, permissions: 0, confiscations: 0, collectionHistory: 0 },
        errors: [error.message],
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleVerification = async () => {
    try {
      const verificationResult = await verifyMigration();
      setVerification(verificationResult);
      toast.success('Verification completed');
    } catch (error) {
      console.error('Verification failed:', error);
      toast.error('Verification failed');
    }
  };

  const totalRecords = result ? (
    result.stats.students +
    result.stats.permissions +
    result.stats.confiscations +
    result.stats.collectionHistory
  ) : 0;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Data Migration</h1>
          <p className="text-muted-foreground">
            Migrate data from Firestore to Ngrok API server
          </p>
        </div>

        {/* Migration Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Migration Overview
            </CardTitle>
            <CardDescription>
              Transfer all existing data from Firebase Firestore to your ngrok-hosted API server
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Database className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold">Source: Firestore</h3>
                  <p className="text-sm text-muted-foreground">Direct Firebase database</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Cloud className="h-8 w-8 text-green-500" />
                <div>
                  <h3 className="font-semibold">Target: Ngrok API</h3>
                  <p className="text-sm text-muted-foreground">Cloud-hosted API server</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Migration Progress */}
        {(isMigrating || progress) && (
          <Card>
            <CardHeader>
              <CardTitle>Migration Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{progress?.current || 'Initializing...'}</span>
                  <span>{progress?.completed || 0}/{progress?.total || 4}</span>
                </div>
                <Progress
                  value={progress ? (progress.completed / progress.total) * 100 : 0}
                  className="w-full"
                />
              </div>

              {progress?.errors.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {progress.errors.map((error, index) => (
                        <div key={index} className="text-sm">{error}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Migration Result */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Migration Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                  {result.message}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{result.stats.students}</div>
                  <div className="text-sm text-muted-foreground">Students</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{result.stats.permissions}</div>
                  <div className="text-sm text-muted-foreground">Permissions</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{result.stats.confiscations}</div>
                  <div className="text-sm text-muted-foreground">Confiscations</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{result.stats.collectionHistory}</div>
                  <div className="text-sm text-muted-foreground">History</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-600">Errors:</h4>
                  <div className="space-y-1">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Verification */}
        {verification && (
          <Card>
            <CardHeader>
              <CardTitle>Data Verification</CardTitle>
              <CardDescription>Compare data counts between Firestore and API</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Firestore (Source)
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Students:</span>
                      <Badge variant="outline">{verification.firestore.students}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Permissions:</span>
                      <Badge variant="outline">{verification.firestore.permissions}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Confiscations:</span>
                      <Badge variant="outline">{verification.firestore.confiscations}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>History:</span>
                      <Badge variant="outline">{verification.firestore.history}</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    Ngrok API (Target)
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Students:</span>
                      <Badge variant="outline">{verification.api.students}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Permissions:</span>
                      <Badge variant="outline">{verification.api.permissions}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Confiscations:</span>
                      <Badge variant="outline">{verification.api.confiscations}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>History:</span>
                      <Badge variant="outline">{verification.api.history}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleMigration}
                disabled={isMigrating || isLoading}
                size="lg"
                className="gap-2"
              >
                <Database className="h-4 w-4" />
                {isMigrating ? 'Migrating...' : 'Start Migration'}
              </Button>

              <Button
                onClick={handleVerification}
                disabled={isMigrating || isLoading}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Verify Data
              </Button>
            </div>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              ⚠️ Migration will transfer all data from Firestore to your ngrok API server
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
