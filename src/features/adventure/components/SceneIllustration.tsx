import React, { useId } from 'react';
import { Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { sceneIllustration, type Scene, type IllustrationName } from '../services/story';
import { useTheme } from '../../../theme';
import { styles } from './SceneIllustration.styles';

const captions: Record<IllustrationName, string> = {
  lobby: 'Atlas Oteli · Gece yarısı resepsiyonu',
  corridor: 'Sessiz koridor · Kapıların ardında',
  elevator: 'Asansör · Bilinmeyen kata doğru',
  mirror: 'Çatlak ayna · Başka bir yansıma',
  letter: 'Eski kayıtlar · Saklanan izler',
  key: 'Pirinç anahtar · Bir kapı daha',
  room: 'Oda 307 · Eşiğin ötesi',
  exterior: 'Atlas Oteli · Yağmurun içinde',
};
const gold = '#EAC689';
const ink = '#12152C';

function Artwork({ kind }: { kind: IllustrationName }) {
  switch (kind) {
    case 'lobby':
      return (
        <G>
          <Path
            d="M35 150V48Q65 15 95 48V150M265 150V48Q295 15 325 48V150"
            fill="#262D4A"
            stroke="#646080"
            strokeWidth="2"
          />
          <Path
            d="M65 37V149M36 91H94M295 37V149M266 91H324"
            stroke="#646080"
          />
          <Circle
            cx="180"
            cy="54"
            r="24"
            fill={ink}
            stroke={gold}
            strokeWidth="2"
          />
          <Path
            d="M180 39V54L193 60"
            stroke={gold}
            strokeWidth="2"
            fill="none"
          />
          <Circle cx="180" cy="111" r="12" fill="#BC98AC" />
          <Path d="M159 150V138Q180 115 201 138V150" fill="#484265" />
          <Rect x="75" y="148" width="210" height="55" rx="4" fill="#554054" />
          <Path d="M75 151H285M88 192H272" stroke={gold} strokeWidth="2" />
          <Path d="M239 146Q239 127 253 127Q267 127 267 146Z" fill={gold} />
          <Circle cx="253" cy="124" r="3" fill={gold} />
          <Path d="M104 143L132 137L155 144L131 150Z" fill="#E5CEB4" />
        </G>
      );
    case 'corridor':
      return (
        <G>
          <Path
            d="M0 10L144 72H216L360 10M0 220L144 156H216L360 220M144 72V156M216 72V156"
            stroke="#72708B"
            fill="none"
          />
          <Path d="M0 211L148 151H212L360 211V220H0Z" fill="#62415A" />
          <Path
            d="M35 51L84 67V169L35 192ZM111 76L130 81V151L111 161ZM325 51L276 67V169L325 192ZM249 76L230 81V151L249 161Z"
            fill={ink}
            stroke="#8C7590"
            strokeWidth="2"
          />
          <Rect x="161" y="88" width="38" height="68" fill="#D5AC79" />
          <Path d="M166 93H192V156H166Z" fill="#3C304C" />
          <Circle cx="70" cy="124" r="3" fill={gold} />
          <Circle cx="288" cy="124" r="3" fill={gold} />
          <Path d="M174 35H186L190 46H170Z" fill={gold} />
        </G>
      );
    case 'elevator':
      return (
        <G>
          <Rect x="98" y="37" width="164" height="167" rx="5" fill="#82728D" />
          <Rect x="107" y="47" width="146" height="157" fill={ink} />
          <Path
            d="M111 51H170V200H111ZM190 51H249V200H190Z"
            fill="#424861"
            stroke="#A99BAC"
          />
          <Path d="M176 51H184V203H176Z" fill={gold} opacity="0.7" />
          <Rect x="153" y="16" width="54" height="17" rx="3" fill={ink} />
          <SvgText x="180" y="29" fill={gold} fontSize="12" textAnchor="middle">
            ↑ 03
          </SvgText>
          <Rect x="277" y="100" width="16" height="36" rx="5" fill="#777089" />
          <Circle cx="285" cy="110" r="3" fill={gold} />
          <Circle cx="285" cy="125" r="3" fill={ink} />
        </G>
      );
    case 'mirror':
      return (
        <G>
          <Ellipse
            cx="180"
            cy="112"
            rx="72"
            ry="92"
            fill="#756279"
            stroke={gold}
            strokeWidth="3"
          />
          <Ellipse cx="180" cy="112" rx="61" ry="81" fill="#3A5065" />
          <Path
            d="M134 146L210 61M142 170L223 78"
            stroke="#B2DCD8"
            strokeWidth="7"
            opacity="0.18"
          />
          <Circle cx="181" cy="98" r="17" fill="#9EA1B5" opacity="0.65" />
          <Path d="M151 174V143Q181 110 210 143V174Z" fill="#24283F" />
          <Path
            d="M191 31L170 81L194 115L171 148L188 193M170 81L139 72M194 115L232 103M171 148L130 160"
            stroke="#D5E7ED"
            strokeWidth="2"
            fill="none"
          />
        </G>
      );
    case 'letter':
      return (
        <G>
          <Path d="M32 178L267 142L333 220H0Z" fill="#584257" />
          <G rotation="-9" origin="180,115">
            <Rect
              x="108"
              y="34"
              width="144"
              height="159"
              rx="3"
              fill="#C5A67E"
            />
            <Path d="M117 43H242V181H117Z" fill="#EBD8B9" />
            <Path
              d="M135 65H221M135 83H210M135 100H225M135 117H196"
              stroke="#9A7B6D"
              strokeWidth="3"
            />
            <Circle cx="180" cy="150" r="17" fill="#914B63" />
            <Path
              d="M170 151L177 143L189 155"
              stroke={gold}
              strokeWidth="2"
              fill="none"
            />
          </G>
          <Path d="M74 179L98 73L106 69L104 83Z" fill={gold} />
        </G>
      );
    case 'key':
      return (
        <G>
          <Ellipse
            cx="180"
            cy="181"
            rx="101"
            ry="16"
            fill={ink}
            opacity="0.5"
          />
          <G rotation="-30" origin="180,110">
            <Circle
              cx="125"
              cy="102"
              r="34"
              fill="none"
              stroke={gold}
              strokeWidth="12"
            />
            <Circle
              cx="125"
              cy="102"
              r="16"
              fill="none"
              stroke="#A5825E"
              strokeWidth="2"
            />
            <Path
              d="M159 102H260V126H245V112H229V127H214V103"
              fill="none"
              stroke={gold}
              strokeWidth="10"
              strokeLinejoin="round"
            />
            <Path d="M119 69V37H159" stroke="#9B899A" fill="none" />
            <Rect
              x="150"
              y="20"
              width="59"
              height="35"
              rx="5"
              fill="#5C4B67"
              stroke={gold}
            />
            <SvgText
              x="180"
              y="43"
              fill={gold}
              fontSize="18"
              textAnchor="middle"
            >
              307
            </SvgText>
          </G>
        </G>
      );
    case 'room':
      return (
        <G>
          <Rect x="116" y="20" width="130" height="187" fill="#9E8191" />
          <Rect x="125" y="29" width="112" height="178" fill="#E6C792" />
          <Path
            d="M237 29L300 1V220L237 207Z"
            fill="#44314D"
            stroke="#B393A0"
            strokeWidth="2"
          />
          <Path d="M139 207L62 220H320L222 207Z" fill={gold} opacity="0.22" />
          <Path d="M150 192V144Q181 120 211 144V192" fill="#706479" />
          <Circle cx="181" cy="112" r="17" fill="#706479" />
          <Circle cx="284" cy="123" r="4" fill={gold} />
          <SvgText x="267" y="69" fill={gold} fontSize="19" textAnchor="middle">
            307
          </SvgText>
        </G>
      );
    case 'exterior':
      return (
        <G>
          <Circle cx="285" cy="43" r="23" fill="#D1C7DB" opacity="0.8" />
          <Path
            d="M73 198V64L180 28L287 64V198Z"
            fill="#31364F"
            stroke="#77708A"
          />
          {[100, 150, 200, 250].map(x => (
            <G key={x}>
              {[80, 120].map(y => (
                <Rect
                  key={y}
                  x={x}
                  y={y}
                  width="15"
                  height="23"
                  rx="2"
                  fill={gold}
                  opacity={x === 200 ? 0.85 : 0.35}
                />
              ))}
            </G>
          ))}
          <Path d="M160 198V166Q180 142 200 166V198" fill={gold} />
          <Path d="M145 150H215L208 140H152Z" fill="#8E5064" />
          <SvgText
            x="180"
            y="64"
            fill={gold}
            fontSize="12"
            letterSpacing="4"
            textAnchor="middle"
          >
            ATLAS
          </SvgText>
          {[25, 60, 113, 145, 223, 269, 318, 345].map((x, i) => (
            <Path
              key={x}
              d={`M${x} ${10 + (i % 3) * 17}l-12 35M${x + 8} 165l-12 35`}
              stroke="#B8C5E1"
              opacity="0.35"
            />
          ))}
          <Ellipse
            cx="180"
            cy="211"
            rx="52"
            ry="4"
            fill={gold}
            opacity="0.25"
          />
        </G>
      );
  }
}

export function SceneIllustration({ scene }: { scene: Scene }) {
  const { colors } = useTheme();
  const kind = sceneIllustration(scene);
  const id = `scene${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View
      style={styles.frame}
      accessible
      accessibilityRole="image"
      accessibilityLabel={captions[kind]}
    >
      <Svg
        style={styles.artwork}
        width="100%"
        height="100%"
        viewBox="0 0 360 220"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#353453" />
            <Stop offset="1" stopColor="#101728" />
          </LinearGradient>
        </Defs>
        <Rect width="360" height="220" fill={`url(#${id})`} />
        <Circle cx="180" cy="92" r="100" fill="#8B719C" opacity="0.07" />
        <Path d="M0 192H360V220H0Z" fill="#181A30" />
        <Artwork kind={kind} />
      </Svg>
      <Text
        accessible={false}
        style={[
          styles.caption,
          {
            color: colors.textSecondary,
            backgroundColor: colors.surfaceRaised,
          },
        ]}
      >
        {captions[kind]}
      </Text>
    </View>
  );
}
