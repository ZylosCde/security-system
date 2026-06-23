import type { NavigatorScreenParams } from '@react-navigation/native';

export type PatrolStackParamList = {
  PatrolHome: undefined;
  OfficerPatrolScan: undefined;
  ScanCheckpoint: { checkpointId?: string } | undefined;
  SampleQr: undefined;
  Violation: undefined;
  Incident: undefined;
  SOS: undefined;
  SOSActive: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Patrols: NavigatorScreenParams<PatrolStackParamList>;
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  ScanAuthQr: { mode: 'device' | 'officer' };
  OfficerBind: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Profile: undefined;
};
