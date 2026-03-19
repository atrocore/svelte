type Button = {
    name: string;
    label: string;
    style?: string;
    disabled?: boolean;
    onClick?: () => void;
    cssStyle?: string;
}

export default Button;
