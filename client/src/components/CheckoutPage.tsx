import "../assets/css/checkout.css";
import { isCreditCard, isMobilePhone, isvalidEmail } from "../utils";
import { CartStore } from "../contexts/CartContext";
import {ChangeEvent, FormEvent, useContext, useEffect, useState} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CartTypes } from "../reducers/CartReducer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons/faPlusCircle";
import { faMinusCircle } from "@fortawesome/free-solid-svg-icons/faMinusCircle";
import {BookItem, CustomerForm, months, OrderDetails, years} from "../types";
import CartItemCount from "../contexts/CartItemCount";
import axios from "axios";

export function CheckoutPage() {
    const getBookImageUrl = function (book: BookItem): string {
        let filename = book.title.toLowerCase();
        filename = filename.replace(/ /g, "-");
        filename = filename.replace(/'/g, "");
        filename = filename + ".jpg";
        try {
            return require(`../assets/images/books/${filename}`);
        } catch (_) {
            return require(`../assets/images/books/atomic-habits.jpg`);
        }
    };

    function yearFrom(index: number) {
        return new Date().getFullYear() + index;
    }

    const { cart, dispatch } = useContext(CartStore);
    const navigate = useNavigate();
    const cartTotalPrice = cart.reduce(
        (total, item) => total + item.quantity * item.book.price,
        0
    );
    const totalItems = CartItemCount();
    const cartQuantity = cart.reduce((total, item) => total + item.quantity, 0);
    const [nameError, setNameError] = useState("");
    const [addressError, setAddressError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [creditError, setCreditError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        address: "",
        phone: "",
        email: "",
        ccNumber: "",
        ccExpiryMonth: 0,
        ccExpiryYear: 0,
    });
    const [checkoutStatus, setCheckoutStatus] = useState("");

    const handleContinueShopping = () => {

        navigate(-2);
    };

    function isValidForm() {
        let valid_form = true;

        if (formData.name === "") {
            setNameError("Name field cannot be empty!");
            valid_form = false;
        }

        if (formData.address === "") {
            setAddressError("Address field cannot be empty!");
            valid_form = false;
        }

        if (formData.phone === "") {
            setPhoneError("Phone number field cannot be empty!");
            valid_form = false;
        } else if (!isMobilePhone(formData.phone)) {
            setPhoneError("Invalid phone number format!");
            valid_form = false;
        }

        if (formData.email === "") {
            setEmailError("Email field cannot be empty!");
            valid_form = false;
        } else if (!isvalidEmail(formData.email)) {
            setEmailError("Invalid email format!");
            valid_form = false;
        }

        if (formData.ccNumber === "") {
            setCreditError("Credit card field number cannot be empty!");
            valid_form = false;
        } else if (!isCreditCard(formData.ccNumber)) {
            setCreditError("Invalid credit card number!");
            valid_form = false;
        }
        return valid_form;
    }


    function handleInputChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = event.target;

        switch (name) {
            case "name":
                setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
                if (value.trim() === "") {
                    setNameError("Name is a required field!");
                } else if (value.length < 4 || value.length > 45) {
                    setNameError("Name must be atleast 4 characters long!");
                } else {
                    setNameError("");
                }
                break;
            case "address":
                setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
                if (value.trim() === "") {
                    setAddressError("Address is a required field!");
                } else if (value.length < 4 || value.length > 45) {
                    setAddressError("Address must be atleast 4 characters long!");
                } else {
                    setAddressError("");
                }
                break;
            case "phone":
                setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
                if (value.trim() === "") {
                    setPhoneError("Phone number is a required field!");
                } else if (!isMobilePhone(value)) {
                    setPhoneError("Phone number is not valid!");
                } else {
                    setPhoneError("");
                }
                break;
            case "email":
                setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
                if (value.trim() === "") {
                    setEmailError("Email is a required field!");
                } else if (!isvalidEmail(value)) {
                    setEmailError("Email is not valid!");
                } else {
                    setEmailError("");
                }
                break;
            case "ccNumber":
                setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
                if (value.trim() === "") {
                    setCreditError("Card number is a required field!");
                } else if (!isCreditCard(value)) {
                    setCreditError("Invalid credit card number!");
                } else {
                    setCreditError("");
                }
                break;
            case "ccExpiryMonth":
            case "ccExpiryYear":
                setFormData((prevFormData) => ({ ...prevFormData, [name]: parseInt(value, 10) }));
                break;
            default:
                break;
        }
    }

    async function submitOrder(event:FormEvent) {
        event.preventDefault();
        console.log("Submit order");
        const isFormCorrect =  isValidForm();
        console.log(isFormCorrect);
        if (!isFormCorrect) {
            setCheckoutStatus("ERROR");
        } else {
            setCheckoutStatus("PENDING");
            const orders = await placeOrder({
                name: formData.name,
                address: formData.address,
                phone: formData.phone,
                email: formData.email,
                ccNumber: formData.ccNumber,
                ccExpiryMonth: formData.ccExpiryMonth,
                ccExpiryYear: formData.ccExpiryYear,
            })
            if(orders) {
                setCheckoutStatus("OK");
                navigate('/confirmation');}
            else{
                console.log("Error placing order");
            }
        }
    }


    const placeOrder =  async (customerForm: CustomerForm) =>  {

        const order = { customerForm: customerForm, cart:{itemArray:cart} };

        const orders = JSON.stringify(order);
        console.log(orders);
        const url = 'http://webdev.cs.vt.edu:8080/JyothiBookstoreReactOrder/api/orders';
        const orderDetails: OrderDetails = await axios.post(url, orders,
            {headers: {
                    "Content-Type": "application/json",
                }
            })
            .then((response) => {
                dispatch({type: CartTypes.CLEAR});
                return response.data;
            })
            .catch((error)=>console.log(error));
        console.log("Order details: ", orderDetails);
        return orderDetails;
    }

    return (
        cart.length > 0 ? (
            <section className="checkout-cart-table-view">
                <div>
                    <ul className="checkout-cart-info">
                        {cart?.map((item, i) => (
                            <div className="checkout-cart-book-item" key={i}>
                                <div className="checkout-cart-book-image">
                                    <img
                                        src={getBookImageUrl(item.book)}
                                        alt="title"
                                        className="checkout-cart-info-img"
                                        width="20%"
                                        height="20%"
                                    />
                                </div>
                                <div className="checkout-cart-book-info">
                                    <div className="checkout-cart-book-title">{item.book.title}</div>
                                    <div className="checkout-cart-book-subtotal">${(item.quantity * item.book.price).toFixed(2)}</div>
                                    <div className="checkout-cart-book-quantity">
                                        <button
                                            className="checkout-icon-inc-button"
                                            onClick={() => {
                                                console.log("Add button clicked");
                                                dispatch({
                                                    type: CartTypes.ADD,
                                                    item: item.book,
                                                });
                                            }}
                                            style={{ backgroundColor: "transparent", border: "none" }}
                                        >
                                            <i className="inc-button">
                                                <FontAwesomeIcon icon={faPlusCircle} />
                                            </i>
                                        </button>
                                        <button className="checkout-num-button">{item.quantity}</button>
                                        <button
                                            className="checkout-icon-dec-button"
                                            onClick={() => {
                                                dispatch({
                                                    type: CartTypes.REMOVE,
                                                    item: item.book,
                                                });
                                            }}
                                            style={{ backgroundColor: "transparent", border: "none" }}
                                        >
                                            <i className="dec-button">
                                                <FontAwesomeIcon icon={faMinusCircle} />
                                            </i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </ul>
                </div>
                <div className={`checkout-page-body ${nameError || addressError || phoneError || emailError || creditError ? "show-errors" : ""}`}>
                    <div>
                        <form className={`checkout-form ${nameError || addressError || phoneError || emailError || creditError ? "show-errors" : ""}`} method="post">
                            <div>
                                <label htmlFor="fname">Name</label>
                                <input
                                    type="text"
                                    size={20}
                                    name="name"
                                    id="fname"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            {nameError && <div className="error">{nameError}</div>}
                            <div>
                                <label htmlFor="home-address">Address</label>
                                <input
                                    type="text"
                                    size={20}
                                    name="address"
                                    id="home-address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                />
                            </div>
                            {addressError && <div className="error">{addressError}</div>}
                            <div>
                                <label htmlFor="phone-number">Phone</label>
                                <input
                                    type="text"
                                    size={20}
                                    name="phone"
                                    id="phone-number"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                />
                            </div>
                            {phoneError && <div className="error">{phoneError}</div>}
                            <div>
                                <label htmlFor="email">Email</label>
                                <input
                                    type="text"
                                    size={20}
                                    name="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </div>
                            {emailError && <div className="error">{emailError}</div>}
                            <div>
                                <label htmlFor="credit-card">Card</label>
                                <input
                                    type="text"
                                    size={20}
                                    name="ccNumber"
                                    id="credit-card"
                                    value={formData.ccNumber}
                                    onChange={handleInputChange}
                                />
                            </div>
                            {creditError && <div className="error">{creditError}</div>}
                            <div className="expiry-date">
                                <label htmlFor="ccExpiryMonth">Exp Date</label>
                                <div className="expiry-date-selects">
                                    <select
                                        style={{color: "black", marginRight: "3px"}}
                                        name="ccExpiryMonth"
                                        value={formData.ccExpiryMonth}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Month</option>
                                        {months.map((month, i) => (
                                            <option key={i} value={i + 1}>
                                                {month}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        className="expiry-year-select"
                                        name="ccExpiryYear"
                                        value={formData.ccExpiryYear}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Year</option>
                                        {years.map((year, i) => (
                                            <option key={i} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </form>
                    </div>
                    <form className="checkout-details" method="post">
                        <div className="checkout-money">
                            <div>
                                <span>Items({cartQuantity})</span>
                                <span>: ${cartTotalPrice.toFixed(2)}</span>
                            </div>
                            <div>
                                <span>Surcharge (18%)</span>
                                <span>: ${(cartTotalPrice * 0.18).toFixed(2)}</span>
                            </div>
                            <div className="horizontal-line"></div>
                            <div className="final-checkout-price">
                                <span>Total</span>
                                <span>: ${(cartTotalPrice + cartTotalPrice * 0.18).toFixed(2)}</span>
                            </div>
                        </div>
                        <button className="checkout-btn-primary" onClick={(event) => {
                            event.preventDefault();
                            if (isValidForm()) {
                                submitOrder(event);
                            } else {
                                setCheckoutStatus("ERROR"); // If invalid, update checkout status
                            }
                        }}>
                            Complete Purchase
                        </button>
                        <div>
                            {checkoutStatus !== "" ? (
                                <section
                                    className={`checkoutStatusBox ${checkoutStatus === "PENDING" || checkoutStatus === "OK" ? "success" : ""}`}>
                                    {checkoutStatus === "ERROR" ? (
                                        <div className="error-message">Error: Please fix the problems above and try
                                            again.</div>
                                    ) : checkoutStatus === "PENDING" ? (
                                        <div className="success-message">Processing...</div>
                                    ) : checkoutStatus === "OK" ? (
                                        <div className="success-message">Order placed...</div>
                                    ) : (
                                        <div className="error-message">An unexpected error occurred, please try
                                            again.</div>
                                    )}
                                </section>
                            ) : (
                                <></>
                            )}
                        </div>
                    </form>

                </div>
            </section>
        ) : (
            <div className="cart-buttons-checkout">
                <div className="cart-info-checkout">
                    Your shopping cart contains {totalItems} {'item' + (totalItems === 1 ? '' : 's')}
                </div>
                <div className="continue-shopping-checkout-container">
                    <button className="continue-shopping-checkout" onClick={handleContinueShopping}>Continue Shopping
                    </button>
                </div>

            </div>
        )
    );
}
