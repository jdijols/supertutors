import brainliftMd from "../../../Acutis-Institute/Acutis-Institute_Brainlift.md?raw";
import { BrainliftViewer } from "./BrainliftViewer";

export function AcutisMount() {
  return (
    <BrainliftViewer
      markdown={brainliftMd}
      title="Acutis Institute — BrainLift"
    />
  );
}

export default AcutisMount;
