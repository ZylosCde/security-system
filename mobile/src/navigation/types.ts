import type { NavigatorScreenParams } from '@react-navigation/native';

export type PatrolStackParamList = {
  PatrolHome: undefined;
  ScanCheckpoint: { checkpointId?: string } | undefined;
  SampleQr: undefined;
  Violation: undefined;
  Incident: undefined;
  SOS: undefined;
  SOSActive: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Patrols: NavigatorScreenParams<PatrolStackParamList>;
  Officers: undefined;
  Devices: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  ScanOfficer: undefined;
  OfficerBind: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Profile: undefined;
};
