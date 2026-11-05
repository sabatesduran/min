import Add01Icon from '@hugeicons/core-free-icons/Add01Icon';
import AiSparklesIcon from '@hugeicons/core-free-icons/AiSparklesIcon';
import ArrowDown01Icon from '@hugeicons/core-free-icons/ArrowDown01Icon';
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon';
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon';
import ArrowUpRight01Icon from '@hugeicons/core-free-icons/ArrowUpRight01Icon';
import ArrowUp01Icon from '@hugeicons/core-free-icons/ArrowUp01Icon';
import Calendar03Icon from '@hugeicons/core-free-icons/Calendar03Icon';
import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon';
import CheckIcon from '@hugeicons/core-free-icons/CheckIcon';
import CheckmarkCircle01Icon from '@hugeicons/core-free-icons/CheckmarkCircle01Icon';
import CheckmarkSquare01Icon from '@hugeicons/core-free-icons/CheckmarkSquare01Icon';
import CircleIcon from '@hugeicons/core-free-icons/CircleIcon';
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon';
import CloudUploadIcon from '@hugeicons/core-free-icons/CloudUploadIcon';
import Copy01Icon from '@hugeicons/core-free-icons/Copy01Icon';
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon';
import Download01Icon from '@hugeicons/core-free-icons/Download01Icon';
import Edit02Icon from '@hugeicons/core-free-icons/Edit02Icon';
import File02Icon from '@hugeicons/core-free-icons/File02Icon';
import Files02Icon from '@hugeicons/core-free-icons/Files02Icon';
import FileTextIcon from '@hugeicons/core-free-icons/FileTextIcon';
import FileUploadIcon from '@hugeicons/core-free-icons/FileUploadIcon';
import FlashIcon from '@hugeicons/core-free-icons/FlashIcon';
import FolderOpenIcon from '@hugeicons/core-free-icons/FolderOpenIcon';
import GlobalIcon from '@hugeicons/core-free-icons/GlobalIcon';
import InformationCircleIcon from '@hugeicons/core-free-icons/InformationCircleIcon';
import Location01Icon from '@hugeicons/core-free-icons/Location01Icon';
import MoreHorizontalIcon from '@hugeicons/core-free-icons/MoreHorizontalIcon';
import Notification03Icon from '@hugeicons/core-free-icons/Notification03Icon';
import RadioButtonIcon from '@hugeicons/core-free-icons/RadioButtonIcon';
import Settings02Icon from '@hugeicons/core-free-icons/Settings02Icon';
import Share01Icon from '@hugeicons/core-free-icons/Share01Icon';
import SquareIcon from '@hugeicons/core-free-icons/SquareIcon';
import StarIcon from '@hugeicons/core-free-icons/StarIcon';
import TaskDaily01Icon from '@hugeicons/core-free-icons/TaskDaily01Icon';
import UserAdd01Icon from '@hugeicons/core-free-icons/UserAdd01Icon';
import UserIcon from '@hugeicons/core-free-icons/UserIcon';
import UserMultiple02Icon from '@hugeicons/core-free-icons/UserMultiple02Icon';
import { HugeiconsIcon, type HugeiconsProps, type IconSvgElement } from '@hugeicons/react-native';

const icons = {
  add: Add01Icon,
  agenda: TaskDaily01Icon,
  back: ArrowLeft01Icon,
  calendar: Calendar03Icon,
  check: CheckIcon,
  checked: CheckmarkSquare01Icon,
  chevronDown: ArrowDown01Icon,
  chevronRight: ArrowRight01Icon,
  external: ArrowUpRight01Icon,
  close: Cancel01Icon,
  complete: CheckmarkCircle01Icon,
  copy: Copy01Icon,
  download: Download01Icon,
  edit: Edit02Icon,
  events: Files02Icon,
  file: File02Icon,
  fileText: FileTextIcon,
  fileUp: FileUploadIcon,
  folderOpen: FolderOpenIcon,
  info: InformationCircleIcon,
  location: Location01Icon,
  more: MoreHorizontalIcon,
  notifications: Notification03Icon,
  now: FlashIcon,
  people: UserMultiple02Icon,
  person: UserIcon,
  personAdd: UserAdd01Icon,
  radioOff: CircleIcon,
  radioOn: RadioButtonIcon,
  settings: Settings02Icon,
  share: Share01Icon,
  sparkles: AiSparklesIcon,
  star: StarIcon,
  trash: Delete02Icon,
  unchecked: SquareIcon,
  incomplete: CircleIcon,
  upload: CloudUploadIcon,
  arrowUp: ArrowUp01Icon,
  web: GlobalIcon,
  time: Clock01Icon,
} satisfies Record<string, IconSvgElement>;

export type MinIconName = keyof typeof icons;

export function MinIcon({ name, size = 20, strokeWidth = 1.8, ...props }: Omit<HugeiconsProps, 'icon'> & { name: MinIconName }) {
  return <HugeiconsIcon icon={icons[name]} size={size} strokeWidth={strokeWidth} accessible={false} {...props} />;
}
