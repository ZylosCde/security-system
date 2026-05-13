import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Welcome: undefined;
  OfficerSelect: undefined;
  Patrol: undefined;
  ScanCheckpoint: { checkpointId?: string };
  Violation: undefined;
  Incident: undefined;
  SOS: undefined;
};

export type RootNav = NativeStackNavigationProp<RootStackParamList>;
