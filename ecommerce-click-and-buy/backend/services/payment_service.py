import hashlib
from database import db
from models.order import Order
from models.payment import Payment
from transbank.webpay.webpay_plus.transaction import Transaction
from transbank.common.options import WebpayOptions
from transbank.common.integration_commerce_codes import IntegrationCommerceCodes
from transbank.common.integration_api_keys import IntegrationApiKeys
from transbank.common.integration_type import IntegrationType

def get_tx():
    return Transaction(WebpayOptions(
        commerce_code=IntegrationCommerceCodes.WEBPAY_PLUS, 
        api_key=IntegrationApiKeys.WEBPAY, 
        integration_type=IntegrationType.TEST
    ))

class PaymentService:
    @staticmethod
    def init_webpay(order_id, user_id):
        order = db.session.get(Order, order_id)
        if not order:
            return {"success": False, "error": "Orden no encontrada"}
        if order.user_id != user_id:
            return {"success": False, "error": "No tienes permiso para pagar esta orden"}
        if order.status == "paid":
            return {"success": False, "error": "Esta orden ya ha sido pagada"}

        # Return URL del frontend (la construiremos en la ruta)
        buy_order = f"CB-{order.id}"
        session_id = f"user_{user_id}"
        amount = order.total
        
        # En la ruta pasaremos el return_url completo, aquí la lógica devuelve los datos base
        return {
            "success": True, 
            "buy_order": buy_order, 
            "session_id": session_id, 
            "amount": amount
        }

    @staticmethod
    def commit_webpay(token_ws):
        try:
            # Confirmar transacción con Transbank
            tx = get_tx()
            response = tx.commit(token_ws)
            
            # Extraer order_id del buy_order (formato CB-ID)
            buy_order_parts = response["buy_order"].split("-")
            order_id = int(buy_order_parts[1]) if len(buy_order_parts) > 1 else None
            
            if not order_id:
                return {"success": False, "error": "Order ID inválido de Transbank"}
                
            order = db.session.get(Order, order_id)
            if not order:
                return {"success": False, "error": "Orden no encontrada en base de datos"}

            # Si el pago fue aprobado
            if response.get("status") == 'AUTHORIZED':
                card_last4 = str(response.get("card_detail", {}).get("card_number", "0000"))
                card_hash = f"tbk_{response.get('authorization_code', '')}"

                payment = Payment(
                    order_id=order.id,
                    amount=response.get("amount", 0),
                    status='success',
                    card_last4=card_last4,
                    card_hash=card_hash
                )
                db.session.add(payment)
                
                order.status = "paid"
                db.session.commit()
                
                return {"success": True, "order_id": order.id, "tbk_response": response}
            else:
                return {"success": False, "error": "El pago fue rechazado por el banco", "order_id": order.id}

        except Exception as e:
            db.session.rollback()
            return {"success": False, "error": str(e)}

    @staticmethod
    def process_mock_payment(order_id, user_id, method):
        # Mantenemos esto para Transferencia o Mercadopago simulado
        order = db.session.get(Order, order_id)
        if not order: return {"success": False, "error": "Orden no encontrada"}
        if order.user_id != user_id: return {"success": False, "error": "No tienes permiso"}
        
        payment = Payment(
            order_id=order.id,
            amount=order.total,
            status='success',
            card_last4=method[:4].upper(),
            card_hash=f"hash_{method}"
        )
        db.session.add(payment)
        order.status = "paid"
        db.session.commit()
        return {"success": True, "payment": payment.to_dict()}
