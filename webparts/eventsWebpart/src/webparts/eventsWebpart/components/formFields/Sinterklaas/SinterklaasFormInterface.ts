export interface KidData {
  nameChild: string;
  presentChoice: 'present' | 'donation';
  presentOption1: string;
  presentOption2: string;
  presentOption3: string;
}

export interface SinterklaasFormFieldsProps {
  amountOfKids: number;
  setAmountOfKids: (value: number) => void;
  kidsData: KidData[];
  setKidsData: (kidsData: KidData[]) => void;
  disabled: boolean;
}